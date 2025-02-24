import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/next';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}<Analytics /></body>
    </html>
  );
}
