import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Space_Grotesk } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wardrobe AI",
  description: "Photograph a fit, find every piece, build the look.",
  applicationName: "Wardrobe AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wardrobe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f3ec" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable}`}
    >
      <head>
        {/* Sets data-theme from storage before first paint - no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-ink font-sans text-cream antialiased">{children}</body>
    </html>
  );
}
