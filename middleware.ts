import { clerkMiddleware } from '@clerk/nextjs/server';

// This protects all routes including api/trpc routes by default
// Public routes are defined in the environment variables
// or using publicRoutes option in clerkMiddleware
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Run on API routes
    '/(api|trpc)(.*)',
    // Run on the root route
    '/',
   ],
}; 