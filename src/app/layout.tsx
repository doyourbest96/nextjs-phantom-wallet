import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Phantom Wallet Integration',
  description: 'Next.js app with Phantom wallet integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}