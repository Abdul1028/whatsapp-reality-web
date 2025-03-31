import { redirect } from 'next/navigation';

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      {/* No server-side cookies access here */}
    </div>
  );
} 