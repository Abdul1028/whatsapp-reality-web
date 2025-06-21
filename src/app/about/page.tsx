import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Github, 
  Linkedin, 
  Mail, 
  MessageSquareText, 
  BarChartBig, 
  ShieldCheck, 
  Sparkles, 
  Code, 
  Cpu,
  Users,
  Zap,
  Globe
} from 'lucide-react';
import Navbar from '../Navbar';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <MessageSquareText className="h-16 w-16 text-primary mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-[--font-pt-sans] mb-6">
            About <span className="text-primary">WhatsApp Reality</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-[--font-nunito]">
            Discover the story behind the most advanced WhatsApp chat analyzer. 
            Built with passion for data visualization and privacy-first design.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-16 md:mb-24">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-[--font-pt-sans] mb-4">
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold font-[--font-pt-sans] mb-2">Privacy First</h3>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Your data never leaves your browser. We believe in complete privacy and security.
                </p>
              </div>
              <div className="text-center">
                <BarChartBig className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold font-[--font-pt-sans] mb-2">Insightful Analytics</h3>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Transform your chat data into meaningful insights with beautiful visualizations.
                </p>
              </div>
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold font-[--font-pt-sans] mb-2">Modern Experience</h3>
                <p className="text-muted-foreground font-[--font-nunito]">
                  Enjoy a seamless, modern interface designed for the best user experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Section */}
        <Card className="mb-16 md:mb-24">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-[--font-pt-sans] mb-4">
              Meet the Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-full mx-auto lg:mx-0 mb-6 flex items-center justify-center">
                  <Code className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold font-[--font-pt-sans] mb-2">Abdul Shaikh</h3>
                <p className="text-lg text-muted-foreground font-[--font-nunito] mb-4">
                  Full-Stack Developer & Data Enthusiast
                </p>
                <p className="text-muted-foreground font-[--font-nunito] mb-6">
                  Passionate about creating innovative solutions that bridge the gap between 
                  complex data and user-friendly experiences. WhatsApp Reality was born from 
                  the desire to help people understand their digital conversations better.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Button asChild variant="outline" size="sm">
                    <Link href="https://github.com/Abdul1028" target="_blank" rel="noopener noreferrer">
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
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card className="mb-16 md:mb-24">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-[--font-pt-sans] mb-4">
              What Makes Us Different
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-lg border bg-card">
                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold font-[--font-pt-sans] mb-2">User-Centric Design</h4>
                <p className="text-muted-foreground font-[--font-nunito] text-sm">
                  Every feature is designed with the user experience in mind.
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-card">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold font-[--font-pt-sans] mb-2">100% Private</h4>
                <p className="text-muted-foreground font-[--font-nunito] text-sm">
                  Your data stays on your device. No servers, no tracking.
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-card">
                <BarChartBig className="h-10 w-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold font-[--font-pt-sans] mb-2">Rich Analytics</h4>
                <p className="text-muted-foreground font-[--font-nunito] text-sm">
                  Comprehensive insights with beautiful, interactive charts.
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-card">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                <h4 className="font-semibold font-[--font-pt-sans] mb-2">Modern UI</h4>
                <p className="text-muted-foreground font-[--font-nunito] text-sm">
                  Sleek, responsive design that works on all devices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-[--font-pt-sans] mb-4">
                Ready to Discover Your Chat Insights?
              </CardTitle>
              <CardDescription className="text-lg font-[--font-nunito]">
                Join thousands of users who are already analyzing their WhatsApp conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="px-8 py-6 text-lg">
                  <Link href="/upload">
                    <MessageSquareText className="h-5 w-5 mr-2" />
                    Start Analyzing
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                  <Link href="/">
                    <Globe className="h-5 w-5 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 