import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Zyden Retail ERP & POS | ADG Supermarket Billing Platform',
  description: 'Production-ready Indian Retail ERP and POS billing application for supermarkets, grocery stores, and retail chains.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
