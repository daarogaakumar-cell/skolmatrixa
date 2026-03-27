import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skolmatrixa.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SkolMatrixa — Best School Management ERP Software India | School ERP",
    template: "%s | SkolMatrixa",
  },
  description:
    "SkolMatrixa is India's #1 cloud-based school management ERP software. Manage students, staff, attendance, exams, fees, timetable, notifications & more. Built for CBSE, ICSE & state board schools and coaching institutes.",
  keywords: [
    "school management software",
    "school ERP software",
    "school management system",
    "coaching institute management",
    "student management system",
    "school attendance software",
    "fee management system",
    "exam management software",
    "school administration software",
    "best school ERP India",
    "cloud school management",
    "online school management",
    "CBSE school software",
    "ICSE school management",
    "timetable management",
    "report card generator",
    "parent portal school",
    "multi-tenant school ERP",
    "SkolMatrixa",
    "school homework management",
    "staff management software",
    "school analytics dashboard",
    "student fee collection software",
    "school notification system",
  ],
  authors: [{ name: "SkolMatrixa", url: APP_URL }],
  creator: "SkolMatrixa",
  publisher: "SkolMatrixa",
  applicationName: "SkolMatrixa",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "Education Technology",
  classification: "School Management Software",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "SkolMatrixa",
    title: "SkolMatrixa — Best School Management ERP Software India",
    description:
      "India's leading cloud-based school management ERP. Manage students, staff, attendance, exams, fees & more — all in one platform.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SkolMatrixa - School Management ERP Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkolMatrixa — Best School Management ERP Software India",
    description:
      "India's leading cloud-based school management ERP. Manage students, staff, attendance, exams, fees & more.",
    images: [`${APP_URL}/og-image.png`],
    creator: "@skolmatrixa",
    site: "@skolmatrixa",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    // Add your actual verification codes when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  other: {
    "msapplication-TileColor": "#1C1C1E",
    "theme-color": "#1C1C1E",
  },
};

// JSON-LD Structured Data for Organization + SoftwareApplication
function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        name: "SkolMatrixa",
        url: APP_URL,
        logo: {
          "@type": "ImageObject",
          url: `${APP_URL}/logo.png`,
          width: 512,
          height: 512,
        },
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-98765-43210",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        url: APP_URL,
        name: "SkolMatrixa",
        publisher: { "@id": `${APP_URL}/#organization` },
        description:
          "India's #1 cloud-based school management ERP software for schools and coaching institutes.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${APP_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "SkolMatrixa",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: APP_URL,
        description:
          "Cloud-based school management ERP software for managing students, staff, attendance, exams, fees, timetable, and more.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
          description: "Free trial available",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "500",
          bestRating: "5",
          worstRating: "1",
        },
        featureList: [
          "Student Management",
          "Staff & HR Management",
          "Attendance Tracking",
          "Timetable Builder",
          "Exam & Report Cards",
          "Fee Management",
          "Homework & Assignments",
          "Smart Notifications",
          "Analytics Dashboard",
          "Multi-tenant Architecture",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is SkolMatrixa suitable for small institutions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely. SkolMatrixa scales from a 50-student coaching centre to a school with 3,000+ students.",
            },
          },
          {
            "@type": "Question",
            name: "How long does the initial setup take?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most institutions complete full setup in under 30 minutes using our guided wizard.",
            },
          },
          {
            "@type": "Question",
            name: "Is my institution's data secure?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Every institution's data is completely isolated in our multi-tenant architecture with enterprise-grade encryption.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <JsonLd />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1C1C1E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SkolMatrixa" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${manrope.variable} ${cormorant.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
