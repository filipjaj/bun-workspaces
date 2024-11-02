"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type MetadataType = {
  url: string;
  title: string;
  openGraph: Record<string, string[]>;
  twitter: Record<string, string[]>;
  meta: Record<string, string[]>;
  links: Record<string, string | string[] | null>;
  schemaOrg: any[];
};

export function Page() {
  const [url, setUrl] = useState("");

  const parseMetadata = useMutation<MetadataType, Error, string>({
    mutationFn: async (url: string) => {
      const response = await fetch("http://localhost:8787/parse-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error("Failed to parse metadata");
      }
      return response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseMetadata.mutate(url);
  };

  const renderMetadataSection = (
    title: string,
    data: Record<string, string[] | string | null>
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2">
              <dt className="text-sm font-medium text-gray-500 col-span-1">
                {key}
              </dt>
              <dd className="text-sm col-span-2 break-all">
                {Array.isArray(value) ? (
                  value.map((v, i) => (
                    <div key={i} className="mb-1">
                      {v.startsWith("http") ? (
                        <a
                          href={v}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                        >
                          {v} <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        v
                      )}
                    </div>
                  ))
                ) : value ? (
                  value.startsWith("http") ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center"
                    >
                      {value} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    value
                  )
                ) : (
                  "-"
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Metadata Parser</h1>
      <Card>
        <CardHeader>
          <CardTitle>Parse Open Graph & Schema.org</CardTitle>
          <CardDescription>Enter a URL to extract metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={parseMetadata.isPending}>
              {parseMetadata.isPending ? "Parsing..." : "Parse"}
            </Button>
          </form>

          {parseMetadata.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to parse metadata: {parseMetadata.error.message}
              </AlertDescription>
            </Alert>
          )}

          {parseMetadata.isSuccess && (
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="og">Open Graph</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="schema">Schema.org</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-2">
                {renderMetadataSection("Basic Information", {
                  url: parseMetadata.data.url,
                  title: parseMetadata.data.title,
                })}
              </TabsContent>

              <TabsContent value="og" className="mt-2">
                {renderMetadataSection(
                  "Open Graph",
                  parseMetadata.data.openGraph
                )}
              </TabsContent>

              <TabsContent value="twitter" className="mt-2">
                {renderMetadataSection("Twitter", parseMetadata.data.twitter)}
              </TabsContent>

              <TabsContent value="meta" className="mt-2">
                {renderMetadataSection("Meta Tags", parseMetadata.data.meta)}
              </TabsContent>

              <TabsContent value="links" className="mt-2">
                {renderMetadataSection("Links", parseMetadata.data.links)}
              </TabsContent>

              <TabsContent value="schema" className="mt-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Schema.org</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap break-all">
                        {parseMetadata.data.schemaOrg.length > 0
                          ? JSON.stringify(
                              parseMetadata.data.schemaOrg,
                              null,
                              2
                            )
                          : "No Schema.org data found"}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
