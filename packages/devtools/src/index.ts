import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

// ... other endpoints ...

app.post("/parse-metadata", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const response = await fetch(url);
    const html = await response.text();

    const getMetaTags = (name: string) => {
      const regex = new RegExp(
        `<meta.*?(?:name|property)=["']${name}["'].*?content=["'](.*?)["']`,
        "gi"
      );
      const matches = [...html.matchAll(regex)];
      return matches.map((match) => match[1]);
    };

    const getLdJson = () => {
      const regex = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
      const matches = [...html.matchAll(regex)];
      return matches
        .map((match) => {
          try {
            return JSON.parse(match[1]);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    };

    const metadata = {
      url: url,
      title: html.match(/<title>(.*?)<\/title>/i)?.[1] || null,
      openGraph: {
        title: getMetaTags("og:title"),
        description: getMetaTags("og:description"),
        image: getMetaTags("og:image"),
        url: getMetaTags("og:url"),
        type: getMetaTags("og:type"),
        siteName: getMetaTags("og:site_name"),
      },
      twitter: {
        card: getMetaTags("twitter:card"),
        site: getMetaTags("twitter:site"),
        creator: getMetaTags("twitter:creator"),
        title: getMetaTags("twitter:title"),
        description: getMetaTags("twitter:description"),
        image: getMetaTags("twitter:image"),
      },
      meta: {
        description: getMetaTags("description"),
        keywords: getMetaTags("keywords"),
        author: getMetaTags("author"),
        viewport: getMetaTags("viewport"),
        robots: getMetaTags("robots"),
      },
      links: {
        canonical:
          html.match(
            /<link.*?rel=["']canonical["'].*?href=["'](.*?)["']/i
          )?.[1] || null,
        icon:
          html.match(/<link.*?rel=["']icon["'].*?href=["'](.*?)["']/i)?.[1] ||
          null,
        alternate: [
          ...html.matchAll(
            /<link.*?rel=["']alternate["'].*?href=["'](.*?)["']/gi
          ),
        ].map((match) => match[1]),
      },
      schemaOrg: getLdJson(),
    };

    return c.json(metadata);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

import { cache } from "hono/cache";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

type Bindings = {
  MY_BUCKET: R2Bucket;
};

type CustomMetadata = {
  originalFilename: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
};

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("/api/*", cors());
app.use(
  "/api/*",
  cache({
    cacheName: "my-app-cache",
    cacheControl: "max-age=3600",
  })
);

// Helper function to generate a unique filename
const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Helper function to get file size in MB
const getFileSizeInMB = (bytes: number): string => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

// Main upload route
app.post("/api/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return c.json(
        {
          error: `File size exceeds maximum limit of 10MB. Your file: ${getFileSizeInMB(
            file.size
          )}MB`,
        },
        400
      );
    }

    // Check file type (you can adjust this list as needed)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return c.json(
        { error: "File type not allowed. Allowed types: JPG, PNG, SVG, PDF" },
        400
      );
    }

    // Generate a unique filename
    const filename = generateUniqueFilename(file.name);

    // Custom metadata
    const customMetadata: CustomMetadata = {
      originalFilename: file.name,
      fileSize: file.size.toString(),
      fileType: file.type,
      uploadDate: new Date().toISOString(),
    };

    // Upload the file to R2
    await c.env.MY_BUCKET.put(filename, file.stream(), {
      httpMetadata: file.type ? { contentType: file.type } : undefined,
      customMetadata,
    });

    // Generate a public URL for the uploaded file
    const publicUrl = `https://pub-8880548ea82e4e66913439824e2f4be4.r2.dev/${filename}`;

    return c.json(
      {
        message: "File uploaded successfully",
        filename,
        fileSize: getFileSizeInMB(file.size),
        fileType: file.type,
        publicUrl,
      },
      201
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return c.json({ error: "Failed to upload file. Please try again." }, 500);
  }
});

app.get("/api/files", async (c) => {
  try {
    const list = await c.env.MY_BUCKET.list();
    const files = await Promise.all(
      list.objects.map(async (object) => {
        const metadata = await c.env.MY_BUCKET.head(object.key);
        const customMetadata = metadata?.customMetadata as CustomMetadata;
        return {
          filename: object.key,
          originalFilename: customMetadata?.originalFilename || object.key,
          fileSize: customMetadata?.fileSize || "0",
          fileType: customMetadata?.fileType || "unknown",
          uploadDate:
            customMetadata?.uploadDate || object.uploaded.toISOString(),
          publicUrl: `https://pub-8880548ea82e4e66913439824e2f4be4.r2.dev/${object.key}`,
        };
      })
    );
    return c.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return c.json({ error: "Failed to fetch files. Please try again." }, 500);
  }
});

// Delete a file
app.delete("/api/files/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    await c.env.MY_BUCKET.delete(filename);
    return c.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return c.json({ error: "Failed to delete file. Please try again." }, 500);
  }
});

// Health check route
app.get("/api/health", (c) => {
  return c.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ message: "Not Found", status: 404 }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ message: "Internal Server Error", status: 500 }, 500);
});

export default app;
