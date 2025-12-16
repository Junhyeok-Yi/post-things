import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientToaster from "@/components/ClientToaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "포스트잇 메모",
  description: "포스트잇 메모 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
          <ClientToaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}