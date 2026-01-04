import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Settings,
  Archive,
  Pin,
  Inbox,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useNotesStore, type Note } from '../../stores/notesStore';
import { useAuthStore } from '../../stores/authStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { cn } from '../../libs/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SidebarCategoryItem } from '../sidebar/SidebarCategoryItem';
import { AddCategoryDialog } from '../categories/AddCategoryDialog';
import { SettingsDialog } from '../settings/SettingsDialog';

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    profile,
    selectedCategoryId,
    setSelectedCategory,
    notes,
    categories,
    reorderCategories,
    reorderNotes,
    moveNote,
  } = useNotesStore();

  const { user } = useAuthStore();

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const pinnedCount = notes.filter((n) => n.pinned && !n.archived).length;
  const archivedCount = notes.filter((n) => n.archived).length;
  const allNotesCount = notes.filter((n) => !n.archived).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'note') {
      setActiveNote(activeData.note);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle note dragging for cross-category
    if (activeData?.type !== 'note') return;

    const activeNote = activeData.note as Note;
    let targetCategoryId: string | null = null;

    // Determine target category
    if (overData?.type === 'note') {
      targetCategoryId = (overData.note as Note).categoryId;
    } else if (overData?.type === 'category') {
      targetCategoryId = overData.category.id;
    }

    // Move note to new category if different
    if (targetCategoryId && activeNote.categoryId !== targetCategoryId) {
      moveNote(activeNote.id, targetCategoryId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNote(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle category reordering
    if (activeData?.type === 'category' && overData?.type === 'category') {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(categories, oldIndex, newIndex).map(
          (cat, index) => ({ ...cat, order: index })
        );
        reorderCategories(newCategories);
      }
      return;
    }

    // Handle note reordering within same category
    if (activeData?.type === 'note' && overData?.type === 'note') {
      const activeNote = activeData.note as Note;
      const overNote = overData.note as Note;

      if (activeNote.categoryId === overNote.categoryId) {
        const categoryNotes = notes.filter(
          (n) => n.categoryId === activeNote.categoryId && !n.archived
        );
        const oldIndex = categoryNotes.findIndex((n) => n.id === active.id);
        const newIndex = categoryNotes.findIndex((n) => n.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newCategoryNotes = arrayMove(categoryNotes, oldIndex, newIndex);
          const otherNotes = notes.filter(
            (n) => n.categoryId !== activeNote.categoryId || n.archived
          );
          reorderNotes([...newCategoryNotes, ...otherNotes]);
        }
      }
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const displayName = user?.name || profile.name;
  const displayEmail = user?.email || profile.email;

  // Get all note IDs for the sortable context
  const allNoteIds = notes.filter((n) => !n.archived).map((n) => n.id);

  const quickFilters = [
    { id: null, label: 'All Notes', icon: Inbox, count: allNotesCount },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: pinnedCount },
    { id: 'archived', label: 'Archived', icon: Archive, count: archivedCount },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "h-screen bg-sidebar flex flex-col transition-all duration-300 ease-out relative",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
        )}
      >
        {/* Subtle border with gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-sidebar-border to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground text-lg">Notes</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Quick filters */}
        <div className="px-3 pb-2">
          <div className="space-y-0.5">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedCategoryId === filter.id;

              return (
                <button
                  key={filter.id ?? 'all'}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  <span className="flex-1 text-left">{filter.label}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground"
                  )}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 h-px bg-sidebar-border" />

        {/* Categories header */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAddCategoryOpen(true)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Add category
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={[...sortedCategories.map((c) => c.id), ...allNoteIds]}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5">
                {sortedCategories.map((category) => (
                  <SidebarCategoryItem key={category.id} category={category} />
                ))}
              </div>
            </SortableContext>

            {/* Drag overlay for notes */}
            <DragOverlay>
              {activeNote && (
                <div className="flex items-center gap-2 px-3 py-1.5 ml-8 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm shadow-lg border border-border">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeNote.title || 'Untitled'}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {categories.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddCategoryOpen(true)}
                className="mt-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create category
              </Button>
            </div>
          )}
        </div>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-sidebar-accent transition-all group"
          >
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-border group-hover:ring-primary/20 transition-all">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-45 transition-all" />
          </button>
        </div>
      </aside>

      {/* Collapsed sidebar trigger */}
      {sidebarCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="fixed top-4 left-4 z-50 h-10 w-10 bg-card border-border shadow-lg hover:shadow-xl hover:bg-card-hover rounded-xl transition-all"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Expand sidebar
          </TooltipContent>
        </Tooltip>
      )}

      <AddCategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </TooltipProvider>
  );
}