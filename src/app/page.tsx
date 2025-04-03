import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquareText, BarChartBig, Users, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "./Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingHeroChart } from "@/components/landing-hero-chart";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center mb-24 md:mb-32">
          <div className="flex flex-col gap-6 items-center md:items-start text-center md:text-left">
            <MessageSquareText className="h-14 w-14 md:h-16 md:w-16 text-primary" strokeWidth={1.5} />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-[--font-pt-sans]">
              Unlock Insights from Your{" "}
              <span className="text-primary">WhatsApp Chats</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg font-[--font-nunito]">
              Analyze, visualize, and understand your conversations like never
              before. Discover activity patterns, identify key participants, and
              gain valuable insights securely and privately.
            </p>
            <Button asChild size="lg" className="px-8 py-6 text-lg mt-4">
              <Link href="/upload">Analyze Your Chat Now</Link>
            </Button>
          </div>
          <div className="mt-12 md:mt-0">
            <LandingHeroChart />
          </div>
        </div>
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl font-bold text-center mb-12 font-[--font-pt-sans]">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <BarChartBig className="h-10 w-10 text-primary/80 mx-auto mb-3" />
                <CardTitle className="font-[--font-pt-sans]">Visualize Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-[--font-nunito]">
                  See charts of message frequency, activity times, and more in an intuitive dashboard.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Users className="h-10 w-10 text-primary/80 mx-auto mb-3" />
                <CardTitle className="font-[--font-pt-sans]">Top Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Quickly identify the most active members and key contributors in your group chats.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-primary/80 mx-auto mb-3" />
                <CardTitle className="font-[--font-pt-sans]">Privacy Focused</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Your chat data is processed entirely in your browser. Nothing is uploaded to our servers.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary/80 mx-auto mb-3" />
                <CardTitle className="font-[--font-pt-sans]">Interactive Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Experience modern, enhanced, and uniquely interactive visualizations of your chat data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
