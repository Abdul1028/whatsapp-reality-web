"use client";

import React, { useState, useCallback } from "react";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

import Navbar from "@/app/Navbar";

import { FaGoogle, FaApple, FaGithub } from "react-icons/fa";
export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading || isOAuthLoading) return;
    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: emailAddress, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Signed in successfully!");
        router.push(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard");
      } else {
        console.log(result);
        toast.error("Sign in failed. Please check console for details.");
      }
    } catch (err: any) {
      toast.error(err.errors ? err.errors[0].longMessage : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = useCallback(async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_github') => {
    if (!isLoaded || isLoading || isOAuthLoading) return;
    setIsOAuthLoading(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard",
      });
    } catch (err: any) {
      toast.error(`Sign in with ${strategy.split('_')[1]} failed.`);
      setIsOAuthLoading(null);
    }
  }, [isLoaded, signIn, isLoading, isOAuthLoading]);

  return (
    <>
    <Navbar/>
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-[--font-pt-sans]">Sign In</CardTitle>
          <CardDescription className="font-[--font-nunito]">
            Access your chat analysis dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
                disabled={isLoading || !!isOAuthLoading}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || !!isOAuthLoading}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !!isOAuthLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('oauth_google')}
              disabled={isLoading || !!isOAuthLoading}
              className="w-full"
            >
              {isOAuthLoading === 'oauth_google' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaGoogle className="mr-2 h-4 w-4" />}
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('oauth_apple')}
              disabled={isLoading || !!isOAuthLoading}
              className="w-full"
            >
               {isOAuthLoading === 'oauth_apple' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaApple className="mr-2 h-4 w-4" />}
              Apple
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('oauth_github')}
              disabled={isLoading || !!isOAuthLoading}
              className="w-full"
            >
               {isOAuthLoading === 'oauth_github' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaGithub className="mr-2 h-4 w-4" />}
              GitHub
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
    </>
  );
} 