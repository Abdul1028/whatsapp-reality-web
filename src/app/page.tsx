import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquareText, BarChartBig, Users } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "./Navbar";
export default function Home() {
  return (
    <>
    <Navbar />
<main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/40">
      <div className="container mx-auto flex flex-col items-center justify-center gap-12 px-4 py-16 text-center">
        <MessageSquareText className="h-16 w-16 text-primary" strokeWidth={1.5} />

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-[--font-pt-sans]">
          Unlock Insights from Your{" "}
          <span className="text-primary">WhatsApp Chats</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl font-[--font-nunito]">
          Analyze, visualize, and understand your conversations like never
          before. Discover activity patterns, identify key participants, and
          gain valuable insights securely and privately.
        </p>

        <Button asChild size="lg" className="px-8 py-6 text-lg">
          <Link href="/dashboard">Analyze Your Chat Now</Link>
        </Button>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          <div className="flex flex-col items-center gap-3">
            <BarChartBig className="h-10 w-10 text-primary/80" />
            <h3 className="text-xl font-semibold font-[--font-pt-sans]">Visualize Data</h3>
            <p className="text-muted-foreground font-[--font-nunito]">
              See charts of message frequency and activity times.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Users className="h-10 w-10 text-primary/80" />
            <h3 className="text-xl font-semibold font-[--font-pt-sans]">Top Participants</h3>
            <p className="text-muted-foreground font-[--font-nunito]">
              Quickly identify the most active members in chats.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check h-10 w-10 text-primary/80">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <h3 className="text-xl font-semibold font-[--font-pt-sans]">Privacy Focused</h3>
            <p className="text-muted-foreground font-[--font-nunito]">
              Your chat data is processed securely (add details if needed).
            </p>
          </div>
        </div>
      </div>
      </main>
    
    </>

  );
}
