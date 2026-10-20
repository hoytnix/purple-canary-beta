import type { Metadata, Viewport } from 'next';
import { Analytics } from "@vercel/analytics/next";
import './globals.css';

export const metadata: Metadata = {
  title: 'Purple Canary — Forensic Substance Analysis Suite',
  description:
    'Decentralized, privacy-first colorimetric substance screening and harm-reduction forensic PWA by TehWiz Productions (tehwiz.com). Spot → Snap → Know.',
  metadataBase: new URL('https://purplecanarylab.com'),
  authors: [{ name: 'TehWiz Productions', url: 'https://tehwiz.com' }],
  creator: 'TehWiz Productions',
  publisher: 'TehWiz Productions',
  keywords: [
    'Purple Canary',
    'TehWiz Productions',
    'tehwiz.com',
    'harm reduction',
    'substance screening',
    'thin-layer chromatography',
    'TLC analysis',
    'reagent testing',
    'fentanyl test',
    'colorimetry',
    'computer vision forensics',
  ],
  openGraph: {
    title: 'Purple Canary — Forensic Substance Analysis Suite',
    description:
      'Decentralized, privacy-first colorimetric substance screening and harm-reduction forensic PWA by TehWiz Productions. Spot → Snap → Know.',
    url: 'https://purplecanarylab.com',
    siteName: 'Purple Canary',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Purple Canary — Forensic Substance Analysis Suite',
    description:
      'Decentralized colorimetric substance screening and harm-reduction forensic PWA by TehWiz Productions (tehwiz.com).',
  },
  other: {
    monetag: '9a47f359b6e91e74211a8ad2a8d125f1',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://tehwiz.com/#organization',
      'name': 'TehWiz Productions',
      'url': 'https://tehwiz.com',
      'logo': 'https://purplecanarylab.com/favicon.ico',
      'description':
        'Pioneering independent studio and technical collective engineering decentralized software, digital forensics, harm reduction utilities, and cybernetic web experiences.',
      'sameAs': ['https://tehwiz.com'],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://purplecanarylab.com/#webapp',
      'name': 'Purple Canary',
      'alternateName': 'Purple Canary Forensic Suite',
      'url': 'https://purplecanarylab.com',
      'applicationCategory': 'HealthApplication, ForensicsApplication, UtilityApplication',
      'operatingSystem': 'Any (Progressive Web App, iOS, Android, Desktop)',
      'description':
        'Decentralized, privacy-first colorimetric substance screening and forensic thin-layer chromatography (TLC) analysis suite for harm reduction. Spot → Snap → Know.',
      'publisher': {
        '@id': 'https://tehwiz.com/#organization',
      },
      'creator': {
        '@id': 'https://tehwiz.com/#organization',
      },
      'author': {
        '@id': 'https://tehwiz.com/#organization',
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'category': 'Harm Reduction Free Access',
        'description':
          'Free public access tier or pay-what-you-want donation for unlimited pro forensic screening and instant PDF reports.',
      },
      'featureList': [
        'Client-side deterministic computer vision colorimetry',
        'Thin-Layer Chromatography (TLC) retention factor (Rf) calculation',
        'Dual-band 365nm and 395nm UV fluorescence spot analysis',
        '285+ substance and adulterant chemical signature matrix',
        'Zero-cloud-leaks local processing with offline PWA support',
        'Cryptographic asymmetric ECDSA P-256 keypair authentication',
        'Instant forensic laboratory PDF report generation',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://purplecanarylab.com/#website',
      'url': 'https://purplecanarylab.com',
      'name': 'Purple Canary',
      'publisher': {
        '@id': 'https://tehwiz.com/#organization',
      },
      'inLanguage': 'en-US',
    },
    {
      '@type': 'Book',
      '@id': 'https://book.purplecanarylab.com/#book',
      'name': 'What Was In That Joint Bro!? — An Introduction To The Purple Canary Protocol',
      'url': 'https://book.purplecanarylab.com/',
      'author': {
        '@type': 'Person',
        'name': 'Michael Scott Hoyt',
      },
      'publisher': {
        '@id': 'https://tehwiz.com/#organization',
      },
      'description':
        'An introduction to the Purple Canary Protocol, kitchen-table chromatography, adulterant detection, and open-source harm reduction.',
      'bookFormat': 'https://schema.org/EBook',
      'license': 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div id="root">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
