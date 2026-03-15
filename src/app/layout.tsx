import type { Metadata } from "next";
import Sidebar from "@/components/layout/sidebar";
import EntityDetailPanel from "@/components/shared/entity-detail-panel";
import AIChatPanel from "@/components/layout/ai-chat-panel";
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
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
        <EntityDetailPanel />
        <AIChatPanel />
      </body>
    </html>
  );
}
