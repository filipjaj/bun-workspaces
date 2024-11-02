"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  File,
  Loader2,
  Search,
  Trash2,
  Image,
  FileText,
  FileArchive,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface FileInfo {
  filename: string;
  originalFilename: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  publicUrl: string;
}

async function fetchFiles(): Promise<FileInfo[]> {
  const response = await fetch(" http://localhost:8787/api/files");
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  return response.json();
}

export function FileDashboardComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof FileInfo>("uploadDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  const {
    data: files,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  const filteredAndSortedFiles = files
    ?.filter((file) =>
      file.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(
        `
        http://localhost:8787/api/files/${filename}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      refetch();
      toast({
        title: "File deleted",
        description: "The file has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the file. Please try again.",
      });
    }
  };

  const handleSort = (column: keyof FileInfo) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/"))
      return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType === "application/pdf")
      return <FileText className="h-5 w-5 text-red-500" />;
    return <FileArchive className="h-5 w-5 text-green-500" />;
  };

  return (
    <Card className="w-full max-w-5xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
          File Dashboard
        </CardTitle>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Manage your uploaded files with ease
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Loader2 className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load files. Please try again later.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("originalFilename")}
                    >
                      File Name{" "}
                      {sortBy === "originalFilename" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("fileSize")}
                    >
                      Size{" "}
                      {sortBy === "fileSize" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("fileType")}
                    >
                      Type{" "}
                      {sortBy === "fileType" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("uploadDate")}
                    >
                      Upload Date{" "}
                      {sortBy === "uploadDate" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredAndSortedFiles?.map((file) => (
                    <motion.tr
                      key={file.filename}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.fileType)}
                          <span
                            className="truncate max-w-[200px]"
                            title={file.originalFilename}
                          >
                            {file.originalFilename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{file.fileSize}</TableCell>
                      <TableCell>{file.fileType}</TableCell>
                      <TableCell>
                        {new Date(file.uploadDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <File className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a
                                href={file.publicUrl}
                                download
                                className="flex items-center"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(file.filename)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
