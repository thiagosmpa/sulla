import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from '../components/Sidebar';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WHATSAPP BOT APP",
  description: "Connect to whatsapp and send messages to your contacts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex">
          <Sidebar />
          <div className="p-14 flex w-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}