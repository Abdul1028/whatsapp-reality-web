import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquareText, BarChartBig, Users, ShieldCheck, Sparkles, Github, Mail, Code, Cpu, Zap, Globe } from "lucide-react";
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
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <Button asChild size="lg" className="px-8 py-6 text-lg">
                <Link href="/upload">Analyze Your Chat Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="py-6 text-lg">
                <Link href="/about">About Us</Link>
              </Button>
            </div>
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

        {/* About Us Section */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-3xl font-bold text-center mb-12 font-[--font-pt-sans]">
            About WhatsApp Reality
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full mx-auto lg:mx-0 mb-6 flex items-center justify-center">
                <Code className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold font-[--font-pt-sans] mb-2">Saumya Maurya</h3>
              <p className="text-xl text-muted-foreground font-[--font-nunito] mb-4">
                Full-Stack Developer & Data Enthusiast
              </p>
              <p className="text-muted-foreground font-[--font-nunito] mb-6">
                Passionate about creating innovative solutions that bridge the gap between 
                complex data and user-friendly experiences. WhatsApp Reality was born from 
                the desire to help people understand their digital conversations better.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button asChild variant="outline" size="sm">
                  <Link href="https://github.com/saum1234" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="mailto:contact@wareality.tech">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="group rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold font-[--font-pt-sans] text-lg">Modern Tech Stack</h4>
                    <p className="text-muted-foreground font-[--font-nunito] text-sm">
                      Built with Next.js, TypeScript, and Tailwind CSS, using shadcn/ui for components. Deployed on Vercel for blazing-fast performance.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold font-[--font-pt-sans] text-lg">Secure Client-Side Processing</h4>
                    <p className="text-muted-foreground font-[--font-nunito] text-sm">
                      All processing happens in your browser for privacy. It works great on laptops and desktops, but large chat files may be slower on mobile devices.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border bg-card/50 p-4 transition-colors hover:bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold font-[--font-pt-sans] text-lg">Global Impact</h4>
                    <p className="text-muted-foreground font-[--font-nunito] text-sm">
                      Helping users worldwide understand their digital communication patterns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
