"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRightLeft } from "lucide-react";

export default function Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseJson = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      setOutput("");
    }
  };

  const stringifyJson = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
      setError(null);
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      setOutput("");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">JSON Tools</h1>
      <Card>
        <CardHeader>
          <CardTitle>JSON Parser and Stringifier</CardTitle>
          <CardDescription>
            Enter your JSON to parse or stringify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Input
            </label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter JSON here..."
              className="min-h-[200px]"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <label
              htmlFor="output"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Output
            </label>
            <Textarea
              id="output"
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="min-h-[200px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={parseJson}>Parse JSON</Button>
          <Button onClick={stringifyJson} variant="outline">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Stringify JSON
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
