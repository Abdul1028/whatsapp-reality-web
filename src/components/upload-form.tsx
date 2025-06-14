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
import { Upload, FileText, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Data Structure Interfaces (Kept for reference, DataFrameRow might be used by dashboard) ---
export interface DataFrameRow { 
  date: string;
  user: string;
  message: string;
  "Message Length": number;
  "Conv code": number | null;
  "Conv change": boolean;
  "Is reply": boolean;
  "Sender change": boolean;
  [userColumn: string]: number | string | boolean | null;
  only_date: string;
  year: number;
  month_num: number;
  month: string;
  day: number;
  day_name: string;
  hour: number;
  minute: number;
  period: string;
  "Reply Time": number;
  "Inter conv time": number;
}

// Other interfaces (BasicStatsData, UserActivityData etc.) are removed from here 
// as their primary role was for localStorage population, which is changing.
// --- End of Data Structure Interfaces ---

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
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== "text/plain") {
      toast.error("Invalid File Type", {
        description: "Please upload a .txt file.",
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    // File size warnings and limits
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Large files may cause issues on mobile devices please do the analyis on a desktop. For best results, use smaller exports");
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Please upload a file smaller than 20MB.");
      setSelectedFile(null);  
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    setSelectedFile(file);
    console.log("Selected file:", file.name);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0] ?? null);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select a chat file first.",
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting analysis for file:", selectedFile.name);
    toast.loading("Processing chat file...", { id: "processing-toast" });

    try {
      const fileContent = await selectedFile.text();
      // Quick message count check before upload
      const messageCount = (fileContent.match(/\n/g) || []).length;
      if (messageCount > 10000) {
        toast.warning("Large files may cause issues on mobile devices. For best results, use smaller exports.");
      }
      if (messageCount > 50000) {
        toast.error("File contains too many messages. Please upload a file with fewer than 50,000 messages.");
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/process-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: fileContent,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error from /api/process-chat:", result);
        toast.error("Processing Failed", {
          id: "processing-toast",
          description: result.error || `API Error: ${response.status}`,
        });
        throw new Error(result.error || `API Error: ${response.status}`);
      }

      // --- Data storage changes --- 
      // No longer storing full processedData in localStorage to avoid QuotaExceededError
      // No longer calculating basicStats or userActivity here.
      
      // Clear potentially large old items from localStorage
      localStorage.removeItem("parsedChatData");
      localStorage.removeItem("basicStats"); 
      localStorage.removeItem("userActivity");
      // For broader compatibility, clear the old umbrella key too if it exists
      localStorage.removeItem("whatsappAnalysisResults"); 

      // Store only the identifier and necessary metadata
      if (!result.dataId) {
        console.error("API did not return a dataId:", result);
        toast.error("Processing Error", {
          id: "processing-toast",
          description: "Could not retrieve a data identifier from the server.",
        });
        throw new Error("Missing dataId from API response");
      }

      localStorage.setItem("chatAnalysisId", result.dataId);
      localStorage.setItem("chatMessageCount", result.processedMessagesCount?.toString() || "0");
      localStorage.setItem("whatsappChatFileName", selectedFile.name);

      console.log(`Stored dataId: ${result.dataId}, Count: ${result.processedMessagesCount}`);
      toast.success("Processing Complete!", {
        id: "processing-toast",
        description: `Successfully processed ${result.processedMessagesCount} messages. Redirecting to dashboard...`,
      });

      // Navigate to dashboard with dataId as a query parameter
      router.push(`/dashboard?id=${result.dataId}`);
      
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
      console.error("Error during analysis:", error);
      toast.error("Analysis Failed", {
        id: "processing-toast", // Ensure existing toast is updated or dismissed
        description: errorMessage,
      });
    } 
    // setIsLoading(false); // isLoading should be set to false after navigation or in case of error
                         // router.push will unmount this component, so setting isLoading might not be strictly necessary if navigation is successful
  };
  return (
    <Card 
      className={cn(
        "w-full max-w-lg mx-auto",
        isDragging && "border-primary ring-2 ring-primary/50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="text-2xl">Upload Chat File</CardTitle>
        <CardDescription>
          Select a .txt chat export file to analyze. Your data is processed locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chat-file">Chat File (.txt)</Label>
          <div 
            className="flex items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/80 transition-colors duration-200 ease-in-out"
            onClick={triggerFileInput}
          >
            {selectedFile ? (
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="font-medium text-sm truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto h-8 w-8 mb-2" />
                <p className="font-medium text-sm">
                  Click to browse or drag & drop
                </p>
                <p className="text-xs">Max file size: 50MB (Recommended)</p>
              </div>
            )}
          </div>
          <Input 
            id="chat-file" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".txt"
            ref={fileInputRef}
          />
        </div>
        {/* Demo Button */}
        {!selectedFile && (
          <Button
            variant="secondary"
            className="w-full mt-2"
            onClick={async () => {
              setIsLoading(true);
              try {
                const res = await fetch('/sample-file/sample.txt');
                if (!res.ok) throw new Error('Failed to load sample file');
                const text = await res.text();
                // Create a File object (simulate user upload)
                const demoFile = new File([text], 'sample.txt', { type: 'text/plain' });
                processFile(demoFile);
              } catch (e) {
                toast.error('Could not load demo file', { description: e instanceof Error ? e.message : String(e) });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Try Demo with Sample File
          </Button>
        )}
        {selectedFile && (
           <div className="text-xs text-muted-foreground flex justify-end items-center">
             <span>Not the right file?</span> 
             <Button variant="link" size="sm" className="h-auto p-1 ml-1 text-xs" onClick={clearFile}>Clear selection</Button>
           </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleAnalyzeClick} 
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Analyze Chat
        </Button>
      </CardFooter>
    </Card>
  );
} 