"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Upload } from "lucide-react";

type OutputFormat = "jpg" | "png" | "webp" | "gif";

export default function ImagePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConvertedImage(null);
      setError(null);
    }
  };

  const convertImage = () => {
    if (!selectedFile) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          let dataUrl: string;

          if (outputFormat === "gif") {
            // For GIF, we'll use a placeholder conversion
            dataUrl = canvas.toDataURL("image/png");
            setError(
              "Note: GIF conversion is simulated. The image is actually in PNG format."
            );
          } else {
            dataUrl = canvas.toDataURL(`image/${outputFormat}`);
          }

          setConvertedImage(dataUrl);
        } else {
          setError("Failed to create canvas context");
        }
      };
      img.onerror = () => {
        setError("Failed to load image");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsDataURL(selectedFile);
  };

  const downloadImage = () => {
    if (convertedImage) {
      const link = document.createElement("a");
      link.href = convertedImage;
      link.download = `converted-image.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Image Converter</h1>
      <Card>
        <CardHeader>
          <CardTitle>Convert Image Format</CardTitle>
          <CardDescription>
            Convert your image to JPG, PNG, WebP, or GIF format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Select Image
            </Button>
            {selectedFile && <span className="ml-2">{selectedFile.name}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="output-format" className="text-sm font-medium">
              Output Format:
            </label>
            <Select
              value={outputFormat}
              onValueChange={(value: OutputFormat) => setOutputFormat(value)}
            >
              <SelectTrigger id="output-format" className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert
              variant={error.startsWith("Note:") ? "default" : "destructive"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {convertedImage && (
            <div className="mt-4">
              <img
                src={convertedImage}
                alt="Converted"
                className="max-w-full h-auto"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={convertImage}>Convert</Button>
          <Button
            onClick={downloadImage}
            disabled={!convertedImage}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
