import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/containers/providers";
import ThemeSwitch from "@/components/theme-controller";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kelson Qu | Full-Stack Developer",
  description:
    "Kelson Qu is a Full-Stack Developer and CS graduate student at Northeastern University, specializing in Java, Go, TypeScript, and distributed systems.",
  metadataBase: new URL("https://www.kelsonqu.com"),
  openGraph: {
    title: "Kelson Qu | Full-Stack Developer",
    description:
      "Full-Stack Developer specializing in Java, Go, TypeScript, and distributed systems.",
    url: "https://www.kelsonqu.com",
    siteName: "Kelson Qu Portfolio",
    images: [
      {
        url: "/Kelson.Q-black.jpg",
        width: 800,
        height: 600,
        alt: "Kelson Qu",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelson Qu | Full-Stack Developer",
    description:
      "Full-Stack Developer specializing in Java, Go, TypeScript, and distributed systems.",
    images: ["/Kelson.Q-black.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col bg-gray-50 text-gray-950 relative dark:bg-gray-900 dark:text-gray-100 dark:text-opacity-90`}
      >
        <div className="fixed inset-0 -z-50">
          <div className="bg-[#fde6d3] absolute top-[-6rem] right-[11rem] h-[31.25rem] w-[31.25rem] rounded-full blur-[10rem] sm:w-[68.75rem] dark:bg-[#3a2e26]"></div>
          <div className="bg-[#d6ecfb] absolute top-[-1rem] left-[-35rem] h-[31.25rem] w-[50rem] rounded-full blur-[10rem] sm:w-[68.75rem] md:left-[-33rem] lg:left-[-28rem] xl:left-[-15rem] 2xl:left-[-5rem] dark:bg-[#1f3a52]"></div>
          <div className="bg-[#d8f5e6] absolute bottom-[-10rem] right-[-10rem] h-[28rem] w-[40rem] rounded-full blur-[10rem] dark:bg-[#1e3a3a] opacity-60"></div>
        </div>
        <Providers>
          <Navbar />
          <div className="flex-grow relative z-10">{children}</div>
          <ThemeSwitch />
          <Footer />
        </Providers>
        <ShootingStars />
        <StarsBackground />
      </body>
    </html>
  );
}
