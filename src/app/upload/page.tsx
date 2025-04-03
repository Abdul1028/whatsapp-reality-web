import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Apple } from "lucide-react";
import Navbar from "../Navbar";
import { UploadForm } from "@/components/upload-form";

// This remains a Server Component
export default function UploadPage() {
  // No event handlers or state needed here anymore

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 font-[--font-pt-sans]">
          Upload Your WhatsApp Chat Export
        </h1>
        <p className="text-center text-muted-foreground mb-12 font-[--font-nunito]">
          Drag & drop your exported `.txt` file below, or click to select it.
          Need help exporting? Instructions are below the upload area.
        </p>

        {/* File Upload Section - Moved Up */}
        <div className="mb-12">
            <UploadForm />
        </div>

        {/* Export Instructions Tabs (Now Below Upload) */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[--font-pt-sans]">How to Export Your Chat</CardTitle>
            <CardDescription className="font-[--font-nunito]">
              Select your mobile operating system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="android" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="android">
                  <Smartphone className="mr-2 h-4 w-4" /> Android
                </TabsTrigger>
                <TabsTrigger value="ios">
                  <Apple className="mr-2 h-4 w-4" /> iOS
                </TabsTrigger>
              </TabsList>
              <TabsContent value="android">
                <div className="space-y-3 text-sm text-muted-foreground font-[--font-nunito]">
                  <p>
                    1. Open the individual or group chat you want to export.
                  </p>
                  <p>
                    2. Tap the three vertical dots (⋮) in the top-right corner.
                  </p>
                  <p>3. Tap <span className="font-semibold text-foreground">More</span> &gt; <span className="font-semibold text-foreground">Export chat</span>.</p>
                  <p>
                    4. Choose <span className="font-semibold text-foreground">Without Media</span>. Exporting with media creates a larger file and is not needed for analysis.
                  </p>
                  <p>
                    5. Select how you want to save or send the `.txt` file (e.g., save to Google Drive, email to yourself).
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="ios">
                <div className="space-y-3 text-sm text-muted-foreground font-[--font-nunito]">
                  <p>
                    1. Open the individual or group chat you want to export.
                  </p>
                  <p>
                    2. Tap the contact or group name at the top of the screen.
                  </p>
                  <p>3. Scroll down and tap <span className="font-semibold text-foreground">Export Chat</span>.</p>
                  <p>
                    4. Choose <span className="font-semibold text-foreground">Without Media</span>. Exporting with media creates a larger file and is not needed for analysis.
                  </p>
                  <p>
                    5. Select how you want to save or send the `.txt` file (e.g., save to Files, AirDrop, email to yourself).
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </>
  );
} 