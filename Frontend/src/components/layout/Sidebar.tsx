import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  PanelLeftClose, PanelLeft, Plus, Settings,
  Pin, Inbox, Sparkles, FileText,
} from 'lucide-react';
import { useAuthStore } from '../../stores/newAuthStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { cn } from '../../libs/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { SidebarCategoryItem } from '../sidebar/SidebarCategoryItem';
import { AddCategoryDialog } from '../categories/AddCategoryDialog';
import { SettingsDialog } from '../settings/SettingsDialog';
import { useCategoryStore } from '../../stores/categoryStore';
import { useNotesStore } from '../../stores/notesStore';
import type { Note } from '../../Types/Note';
import type { CategoryItem } from '../../stores/categoryStore';

// Only fires when pointer is inside an element — most precise for nested layouts
const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

type DragType = 'note' | 'category' | null;

interface SidebarProps {
  forceMobile?: boolean;
}

export function Sidebar({ forceMobile }: SidebarProps = {}) {
  const {
    sidebarCollapsed, toggleSidebar,
    selectedCategoryId, setSelectedCategory,
    moveNote, reorderNotes,
  } = useNotesStore();

  const { authUser: user } = useAuthStore();
  const { categories, getCategory, reorderCategories } = useCategoryStore();

  useEffect(() => { getCategory(); }, [getCategory]);

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [localCategories, setLocalCategories] = useState<CategoryItem[]>([]);

  // What type is currently being dragged — gates which SortableContexts are active
  const [dragType, setDragType] = useState<DragType>(null);

  const isDraggingRef = useRef(false);
  // Tracks the note's CURRENT category as it moves across — NOT the stale snapshot from active.data
  const currentDragCategoryRef = useRef<string | null>(null);

  // Sync store → local only when idle
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalCategories([...categories].sort((a, b) => a.order - b.order));
    }
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const allNotes = localCategories.flatMap((c) => c.notes ?? []);
  const pinnedCount = allNotes.filter((n) => n.pinned).length;

  // ─── Drag Start ────────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    isDraggingRef.current = true;

    if (data?.type === 'note') {
      setDragType('note');
      setActiveNote(data.note);
      currentDragCategoryRef.current = data.note.categoryId;
    } else if (data?.type === 'category') {
      setDragType('category');
    }
  };

  // ─── Drag Over ─────────────────────────────────────────────────────────────
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'note') return;

    const activeNoteId = active.id as string;
    const draggedNote = activeData.note as Note;
    const sourceCategoryId = currentDragCategoryRef.current!;

    // Resolve target category — now also handles empty zone droppables
    let targetCategoryId: string | null = null;
    if (overData?.type === 'note') targetCategoryId = overData.note.categoryId;
    else if (overData?.type === 'category') targetCategoryId = overData.category._id;

    if (!targetCategoryId) return;

    if (sourceCategoryId === targetCategoryId) {
      if (overData?.type !== 'note') return;
      setLocalCategories((prev) => prev.map((cat) => {
        if (cat._id !== sourceCategoryId) return cat;
        const oldIdx = cat.notes.findIndex((n) => n._id === activeNoteId);
        const newIdx = cat.notes.findIndex((n) => n._id === over.id);
        if (oldIdx === -1 || newIdx === -1) return cat;
        return { ...cat, notes: arrayMove(cat.notes, oldIdx, newIdx) };
      }));
    } else {
      currentDragCategoryRef.current = targetCategoryId;
      setLocalCategories((prev) => prev.map((cat) => {
        if (cat._id === sourceCategoryId) {
          return { ...cat, notes: cat.notes.filter((n) => n._id !== activeNoteId) };
        }
        if (cat._id === targetCategoryId) {
          if (cat.notes.some((n) => n._id === activeNoteId)) return cat;
          const movedNote: Note = { ...draggedNote, categoryId: targetCategoryId };
          if (overData?.type === 'note') {
            const insertAt = cat.notes.findIndex((n) => n._id === over.id);
            const updated = [...cat.notes];
            updated.splice(insertAt >= 0 ? insertAt : updated.length, 0, movedNote);
            return { ...cat, notes: updated };
          }
          // Dropped on category header OR empty zone — append
          return { ...cat, notes: [...cat.notes, movedNote] };
        }
        return cat;
      }));
    }
  };

  // ─── Drag End ──────────────────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Capture ref values BEFORE resetting them
    const finalCategoryId = currentDragCategoryRef.current;

    setActiveNote(null);
    setDragType(null);
    isDraggingRef.current = false;
    currentDragCategoryRef.current = null;

    if (!over || active.id === over.id) {
      setLocalCategories([...categories].sort((a, b) => a.order - b.order));
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // ── Category reorder ─────────────────────────────────────────────────────
    if (activeData?.type === 'category' && overData?.type === 'category') {
      const oldIdx = localCategories.findIndex((c) => c._id === active.id);
      const newIdx = localCategories.findIndex((c) => c._id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(localCategories, oldIdx, newIdx).map(
        (cat, i) => ({ ...cat, order: i })
      );
      setLocalCategories(reordered);
      reorderCategories(reordered);
      return;
    }

    // ── Note drop ────────────────────────────────────────────────────────────
    if (activeData?.type === 'note') {
      const originalNote = activeData.note as Note;

      // Resolve where the note actually landed
      let targetCategoryId: string | null = null;
      if (overData?.type === 'note') targetCategoryId = overData.note.categoryId;
      else if (overData?.type === 'category') targetCategoryId = overData.category._id;

      if (!targetCategoryId) {
        setLocalCategories([...categories].sort((a, b) => a.order - b.order));
        return;
      }

      const targetCategory = localCategories.find((c) => c._id === targetCategoryId);
      if (!targetCategory) return;

      const isCrossCategory = originalNote.categoryId !== targetCategoryId;
      // finalCategoryId is where the note visually ended up after all dragOver events
      const hasVisuallyMoved = finalCategoryId !== originalNote.categoryId;

      if (isCrossCategory) {
        // API call — visual state already correct from dragOver optimistic updates
        moveNote(originalNote._id, targetCategoryId);
      } else if (!isCrossCategory) {
        // Same category reorder
        const reorderedNotes = targetCategory.notes.map((note, i) => ({
          _id: note._id,
          order: i,
        }));
        reorderNotes(reorderedNotes, targetCategoryId, targetCategory.notes);
      }

      // Edge case: note was dragged over another category mid-drag but dropped back
      // on original — visual already reset via dragOver, no API needed
      if (hasVisuallyMoved && !isCrossCategory) {
        setLocalCategories([...categories].sort((a, b) => a.order - b.order));
      }
    }
  };

  const displayName = user?.name;
  const displayEmail = user?.email;

  const quickFilters = [
    { id: null, label: 'All Notes', icon: Inbox, count: allNotes.length },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: pinnedCount },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 ease-out relative",
        forceMobile
          ? "w-full"
          : sidebarCollapsed ? "w-0 overflow-hidden" : "w-72 2xl:w-80"
      )}>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-sidebar-border to-transparent" />

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground text-lg">Notes</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleSidebar}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg">
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Collapse sidebar</TooltipContent>
          </Tooltip>
        </div>

        <div className="px-3 pb-2">
          <div className="space-y-0.5">
            {quickFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedCategoryId === filter.id;
              return (
                <button key={filter.id ?? 'all'}
                  onClick={() => {
                    setSelectedCategory(filter.id);
                    if (forceMobile) {
                      useNotesStore.getState().toggleSidebar();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                  )}>
                  <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  <span className="flex-1 text-left">{filter.label}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground")}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-4 my-2 h-px bg-sidebar-border" />

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setAddCategoryOpen(true)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Add category</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/*
              OUTER SortableContext — only category IDs.
              When a NOTE is being dragged, this context is effectively inactive
              because no category item will respond to note drag events.
            */}
            <SortableContext
              items={localCategories.map((c) => c._id)}
              strategy={verticalListSortingStrategy}
              disabled={dragType === 'note'} // ← categories frozen while dragging a note
            >
              <div className="space-y-0.5">
                {localCategories.map((category) => (
                  <SidebarCategoryItem
                    key={category._id}
                    category={category}
                    isDraggingNote={dragType === 'note'}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeNote && (
                <div className="flex items-center gap-2 px-3 py-1.5 ml-8 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm shadow-lg border border-border opacity-95">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeNote.title || 'Untitled'}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {localCategories.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <Button variant="ghost" size="sm" onClick={() => setAddCategoryOpen(true)}
                className="mt-2 text-primary hover:text-primary hover:bg-primary/10">
                <Plus className="w-4 h-4 mr-1" />
                Create category
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-sidebar-accent transition-all group">
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-border group-hover:ring-primary/20 transition-all">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-45 transition-all" />
          </button>
        </div>
      </aside>

      {sidebarCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={toggleSidebar}
              className="fixed top-4 left-4 z-50 h-10 w-10 bg-card border-border shadow-lg hover:shadow-xl hover:bg-card-hover rounded-xl transition-all">
              <PanelLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
      )}

      <AddCategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </TooltipProvider>
  );
}