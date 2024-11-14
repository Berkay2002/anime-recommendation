// /frontend/app/layout.tsx
import React from 'react';
import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) { // Added type for children
  return (
    <html lang="en">
      <head>
        {/* Meta tags and favicons can go here */}
      </head>
      <body className="bg-background text-white">
        {children} {/* Ensure children are rendered here */}
      </body>
    </html>
  );
}