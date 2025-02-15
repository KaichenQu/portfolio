import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Providers from "@/containers/providers";
import ThemeSwitch from "@/components/theme-controller";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Frontend | Advance",
  description: "Frontend Advance Personal portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${sora.variable} font-Sora min-h-screen flex flex-col bg-gray-50 text-gray-950 relative dark:bg-gray-900 dark:text-gray-100 dark:text-opacity-90`}
      >
        <div className="fixed inset-0 -z-50">
          <div className="bg-[#fbe2e3] absolute top-[-6rem] right-[11rem] h-[31.25rem] w-[31.25rem] rounded-full blur-[10rem] sm:w-[68.75rem] dark:bg-[#473031]"></div>
          <div className="bg-[#dbd7fb] absolute top-[-1rem] left-[-35rem] h-[31.25rem] w-[50rem] rounded-full blur-[10rem] sm:w-[68.75rem] md:left-[-33rem] lg:left-[-28rem] xl:left-[-15rem] 2xl:left-[-5rem] dark:bg-[#5c5984]"></div>
        </div>
        <Providers>
          <Navbar />
          <main className="flex-grow relative z-10">{children}</main>
          <ThemeSwitch />
          <Footer />
        </Providers>
        <ShootingStars />
        <StarsBackground />
      </body>
    </html>
  );
}
