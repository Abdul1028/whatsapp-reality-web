import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  // Handle the redirect flow by rendering the
  // prebuilt AuthenticateWithRedirectCallback component.
  // This is needed for OAuth flows.
  return (
      <div className="flex items-center justify-center min-h-screen">
          {/* You can add a loading spinner here if desired */}
          <AuthenticateWithRedirectCallback />
      </div>
  );
} 