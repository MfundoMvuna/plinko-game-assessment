import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plinko — Drop & Score',
  description:
    'A browser-based Plinko game with real-time physics, particle effects, and a global leaderboard.',
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
