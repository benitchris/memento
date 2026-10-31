import type { Metadata } from 'next';
import './globals.css';
import { MementoProvider } from '@/lib/context/memento-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { OnboardingModal } from '@/components/onboarding-modal';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Memento — Rwanda’s Accommodation Booking Marketplace',
  description:
    'Discover, compare and book accommodation throughout Rwanda. From private rooms to luxury retreats, find your place in Rwanda.',
  keywords: [
    'Rwanda accommodation',
    'Kigali hotels',
    'Musanze gorilla lodge',
    'Lake Kivu resort',
    'Rwanda guesthouse',
    'Book stay in Rwanda',
    'Memento',
  ],
  authors: [{ name: 'Memento Rwanda' }],
  openGraph: {
    title: 'Memento — Find your place in Rwanda',
    description: 'Universal accommodation booking platform across the Land of a Thousand Hills.',
    url: 'https://memento.rw',
    siteName: 'Memento',
    images: [
      {
        url: '/images/hero-rwanda.png',
        width: 1200,
        height: 630,
        alt: 'Memento Rwanda Accommodation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#faf8f5] text-[#18191b] antialiased">
        <MementoProvider>
          <Navbar />
          <OnboardingModal />
          <main className="flex-1">{children}</main>
          <Footer />
        </MementoProvider>
      </body>
    </html>
  );
}
