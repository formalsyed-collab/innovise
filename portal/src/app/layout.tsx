import type { Metadata } from "next";
import { Geist, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Innovise Consultant | Secure Client Portal",
  description: "Secure Client Portal for company registration, GST, tax, trademark, and compliance services in Kanpur, India.",
  keywords: [
    "CA in Kanpur", "CS in Kanpur", "Company Registration Kanpur", "GST registration Kanpur", 
    "Tax consultant Civil Lines Kanpur", "Best CA near me Kanpur", "Top CS firm in UP", 
    "Income tax return filing Kanpur", "Innovise Consultant", "Client Portal"
  ],
  authors: [{ name: "Innovise Consultant" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://innovise.in/",
    title: "Innovise Consultant | Secure Client Portal",
    description: "Secure Client Portal for company registration, GST, tax, trademark, and compliance services in Kanpur, India.",
    siteName: "Innovise Consultant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Innovise Consultant | Client Portal",
    description: "Secure Client Portal for CA & CS services in Kanpur.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${bricolageGrotesque.variable} h-full antialiased`}>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8NDKYQ29HG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-8NDKYQ29HG');
          `}
        </Script>
      </head>
      <body className="min-h-full bg-pearl text-body-text font-bf flex flex-col">{children}</body>
    </html>
  );
}


