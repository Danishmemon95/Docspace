import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../libs/utils';
import { useNotesStore } from '../../stores/notesStore';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useNotesStore()

  // Initialize theme
  useTheme();

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
