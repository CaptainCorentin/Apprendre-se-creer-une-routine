import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { NavBar } from "@/components/NavBar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ForcedJournalModals } from "@/components/ForcedJournalModals";
import { MondayRecapModal } from "@/components/MondayRecapModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Routine — Growth Mindset",
  description: "Suivi de routine personnelle et journal de growth mindset",
  appleWebApp: {
    title: "Routine",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <main className="flex-1 pb-24">{children}</main>
          <NavBar />
          <NotificationCenter />
          <ForcedJournalModals />
          <MondayRecapModal />
        </AppProvider>
      </body>
    </html>
  );
}
