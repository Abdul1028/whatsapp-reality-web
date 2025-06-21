import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, MessageSquareText, Search } from 'lucide-react';
import Navbar from './Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Icon and Number */}
          <div className="mb-8">
            <div className="relative inline-block">
              <MessageSquareText className="h-24 w-24 text-primary/20 mx-auto mb-4" strokeWidth={1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl md:text-8xl font-bold text-primary font-[--font-pt-sans]">404</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold font-[--font-pt-sans] mb-4">
                Page Not Found
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground font-[--font-nunito]">
                Ah Ah! It looks like this chat message got lost in the conversation or 
                the page you're looking for doesn't exist or has been moved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="px-8 py-6 text-lg">
                  <Link href="/">
                    <Home className="h-5 w-5 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                  <Link href="/upload">
                    <Search className="h-5 w-5 mr-2" />
                    Analyze Chat
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