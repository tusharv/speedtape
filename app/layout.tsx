import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { APP_NAME, PAGES_URL } from "@/lib/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const description =
  "House internet record. Scheduled tests you can take to your ISP.";

export const metadata: Metadata = {
  metadataBase: new URL(PAGES_URL),
  title: APP_NAME,
  description,
  openGraph: {
    title: APP_NAME,
    description,
    url: PAGES_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className={`${sans.className} flex min-h-full min-w-0 flex-col`}>
        {children}
      </body>
    </html>
  );
}
