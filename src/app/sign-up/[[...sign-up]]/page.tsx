"use client";

import React, { useState, useCallback } from "react";
import { useClerk, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaApple, FaGithub } from "react-icons/fa";
import Navbar from "@/app/Navbar";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading || isOAuthLoading) return;
    setIsLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
      toast.info("Verification code sent to your email.");

    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      toast.error(err.errors ? err.errors[0].longMessage : "Sign up failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isLoading || isOAuthLoading) return;
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Account created successfully!");
        router.push(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        toast.error("Verification failed. Please check the code.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      toast.error(err.errors ? err.errors[0].longMessage : "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = useCallback(async (strategy: 'oauth_google' | 'oauth_apple' | 'oauth_github') => {
    if (!isLoaded || isLoading || isOAuthLoading) return;
    setIsOAuthLoading(strategy);
    try {
      await signUp.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard",
      });
    } catch (err: any) {
      console.error("OAuth error", err);
      toast.error(`Sign up with ${strategy.split('_')[1]} failed.`);
      setIsOAuthLoading(null);
    }
  }, [isLoaded, signUp, isLoading, isOAuthLoading]);

  return (
    <>
    <Navbar/>
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-[--font-pt-sans]">
            {pendingVerification ? "Verify Your Email" : "Create Account"}
          </CardTitle>
          <CardDescription className="font-[--font-nunito]">
            {pendingVerification
              ? "Enter the code sent to your email."
              : "Get started with chat analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!pendingVerification && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email" type="email" value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required disabled={isLoading || !!isOAuthLoading} placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required disabled={isLoading || !!isOAuthLoading} placeholder="••••••••"
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                </div>
                <div id="clerk-captcha"></div>
                <Button type="submit" className="w-full" disabled={isLoading || !!isOAuthLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
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
                  onClick={() => handleOAuthSignUp('oauth_google')}
                  disabled={isLoading || !!isOAuthLoading}
                  className="w-full"
                >
                  {isOAuthLoading === 'oauth_google' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaGoogle className="mr-2 h-4 w-4" />}
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignUp('oauth_apple')}
                  disabled={isLoading || !!isOAuthLoading}
                  className="w-full"
                >
                  {isOAuthLoading === 'oauth_apple' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaApple className="mr-2 h-4 w-4" />}
                  Apple
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignUp('oauth_github')}
                  disabled={isLoading || !!isOAuthLoading}
                  className="w-full"
                >
                  {isOAuthLoading === 'oauth_github' ? <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary rounded-full"></span> : <FaGithub className="mr-2 h-4 w-4" />}
                  GitHub
                </Button>
              </div>
            </>
          )}

          {pendingVerification && (
            <form onSubmit={onPressVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code" value={code} placeholder="123456" required
                  onChange={(e) => setCode(e.target.value)} disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          {!pendingVerification && (
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" asChild className="p-0 h-auto font-semibold">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
    </>
  );
} 