import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "StudioPresto Admin",
  description: "Gestion des sites restaurants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${spaceMono.variable} h-full`}>
      <body className="h-full flex flex-col antialiased">
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#161619",
                border: "1px solid #2A2A30",
                color: "#F0F0F2",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
