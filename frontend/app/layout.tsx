import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Meta tags and favicons can go here */}
      </head>
      <body className="bg-background text-white">
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
  
}
