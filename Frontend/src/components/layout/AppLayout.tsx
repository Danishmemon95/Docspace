import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../libs/utils';
import { Button } from '../../components/ui/button';
import { Sheet, SheetContent } from '../../components/ui/sheet';
import { useIsMobile } from '../../hooks/use-mobile';
import { useNotesStore } from '../../stores/notesStore';
import { PanelLeft } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, toggleSidebar } = useNotesStore();
  const isMobile = useIsMobile();

  useTheme();

  if (isMobile) {
    return (
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        {/* Mobile hamburger */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-3 left-3 z-50 h-10 w-10 bg-card border-border shadow-lg rounded-xl"
        >
          <PanelLeft className="w-5 h-5" />
        </Button>

        <Sheet open={!sidebarCollapsed} onOpenChange={() => toggleSidebar()}>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <Sidebar forceMobile />
          </SheetContent>
        </Sheet>

        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main
        className={cn(
          "flex-1 flex overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-0" : "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
