"use client"; // <-- Mark this component as a Client Component

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function UploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Optional: for loading state
  const [isDragging, setIsDragging] = useState(false); // State for drag-over visual feedback
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden input

  // Extracted file processing logic
  const processFile = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validation
    if (file.type !== "text/plain") {
      toast.error("Invalid File Type", {
        description: "Please upload a .txt file.",
      });
      setSelectedFile(null);
      // Clear the hidden input if it was used
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    console.log("Selected file:", file.name);
  }, []); // Empty dependency array as it doesn't depend on external state/props

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] ?? null);
  };

  // Drag and Drop Handlers
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Necessary to allow dropping
    setIsDragging(true); // Keep dragging state active
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]); // Process the first dropped file
    }
  };

  // Function to trigger hidden file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Function to clear the selected file
  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the actual input element
    }
  };

  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select a chat file first.",
      });
      return;
    }

    setIsLoading(true); // Set loading state
    console.log("Analyzing file:", selectedFile.name);

    try {
      // **IMPORTANT: File Reading Logic**
      // Since this is client-side, we read the file here
      const fileContent = await selectedFile.text();

      // **Store the content (e.g., in localStorage or state management)**
      // For simplicity, let's use localStorage for now.
      // In a real app, consider state management (Zustand, Redux, Context)
      // or passing data via URL (less ideal for large content).
      localStorage.setItem("whatsappChatContent", fileContent);
      localStorage.setItem("whatsappChatFileName", selectedFile.name); // Store filename too

      toast.success("File Ready!", {
        description: `"${selectedFile.name}" is ready for analysis.`,
      });

      // Navigate to the dashboard page
      router.push("/dashboard");

    } catch (error) {
      console.error("Error reading or processing file:", error);
      toast.error("Error Processing File", {
        description: "Could not read or process the selected file.",
      });
      setIsLoading(false); // Reset loading state on error
    }
    // No need to reset loading state on success because we navigate away
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-[--font-pt-sans]">Upload File</CardTitle>
        <CardDescription className="font-[--font-nunito]">
          Drag & drop or click to select the exported `.txt` chat file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Hidden actual file input */}
        <Input
          ref={fileInputRef}
          id="chatfile-hidden"
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          disabled={isLoading}
          className="hidden" // Hide the default input
        />

        {/* Visible Drop Zone / File Info Area */}
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out",
            "border-border bg-muted/30 hover:bg-muted/50", // Default state
            isDragging && "border-primary bg-primary/10", // Dragging state
            selectedFile && "border-primary/50 bg-primary/5" // File selected state
          )}
          onClick={!selectedFile ? triggerFileInput : undefined} // Trigger input only if no file selected
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          aria-labelledby="file-upload-label"
        >
          {selectedFile ? (
            // Display File Info
            <div className="flex flex-col items-center text-center p-4 relative w-full">
               <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-6 w-6"
                  onClick={clearFile}
                  aria-label="Clear selected file"
                >
                  <XCircle className="h-5 w-5" />
               </Button>
              <FileText className="w-12 h-12 text-primary mb-3" />
              <p id="file-upload-label" className="font-semibold text-foreground break-all px-4">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatBytes(selectedFile.size)} - {selectedFile.type}
              </p>
               <Button variant="link" size="sm" className="mt-3 text-xs" onClick={triggerFileInput}>
                 Select a different file
               </Button>
            </div>
          ) : (
            // Display Upload Prompt
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <Upload
                className={cn(
                  "w-10 h-10 mb-3 text-muted-foreground transition-colors",
                  isDragging && "text-primary"
                )}
              />
              <p id="file-upload-label" className="mb-2 text-sm font-semibold text-foreground">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                WhatsApp Chat Export (.txt file only)
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleAnalyzeClick}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Processing..." : "Analyze Chat"}
        </Button>
      </CardFooter>
    </Card>
  );
} 