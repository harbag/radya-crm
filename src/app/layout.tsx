import type { Metadata } from "next";
import ThemeProvider from "@/components/layout/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radya CRM",
  description: "CRM for Radya Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
