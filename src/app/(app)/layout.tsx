import {
  DesktopSidebar,
  MobileSidebar,
  MobileTopBar,
} from '@/components/layout/sidebar'
import EntityDetailPanel from '@/components/shared/entity-detail-panel'
import AIChatPanel from '@/components/layout/ai-chat-panel'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
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
    </>
  )
}
