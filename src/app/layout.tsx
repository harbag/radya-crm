import type { Metadata } from "next";
import { DesktopSidebar, MobileSidebar, MobileTopBar } from "@/components/layout/sidebar";
import EntityDetailPanel from "@/components/shared/entity-detail-panel";
import AIChatPanel from "@/components/layout/ai-chat-panel";
import ThemeProvider from "@/components/layout/theme-provider";
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
          <div className="flex h-screen overflow-hidden bg-background">
            <DesktopSidebar />
            <MobileSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <MobileTopBar />
              {children}
            </div>
          </div>
          <EntityDetailPanel />
          <AIChatPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}
