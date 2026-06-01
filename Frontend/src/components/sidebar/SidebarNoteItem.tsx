import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, MoreHorizontal, Trash2, Copy, Pin, PinOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { useState } from 'react';
import { cn } from '../../libs/utils';
import { useNotesStore } from '../../stores/notesStore';
import type { Note } from '../../Types/Note';
import { useIsMobile } from '../../hooks/use-mobile';

interface SidebarNoteItemProps {
  note: Note;
  isPinnedView?: boolean;
  isDeletedView?: boolean;
}

export function SidebarNoteItem({ note, isPinnedView = false, isDeletedView = false }: SidebarNoteItemProps) {
  const { selectedNoteId, setSelectedNote, deleteNote, duplicateNote, togglePin, restoreNote, toggleSidebar } = useNotesStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const isMobile = useIsMobile();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note._id,
    data: { type: 'note', note },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = selectedNoteId === note._id;

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteNote(note._id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const handleDuplicate = () => {
    duplicateNote(note._id);
    setDropdownOpen(false);
  };

  const handleTogglePin = () => {
    togglePin(note._id);
    setDropdownOpen(false);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    await restoreNote(note._id);
    setIsRestoring(false);
    setDropdownOpen(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 ml-8 rounded-lg cursor-pointer transition-colors text-sm",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          isDragging && "opacity-50"
        )}
        onClick={() => {
          if (showDeleteDialog || dropdownOpen) return;
          setSelectedNote(note._id);
          if (isMobile) toggleSidebar();
        }}
      >
        {!isDeletedView && (
          <button
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate flex-1">{note.title || 'Untitled'}</span>

        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {isDeletedView ? (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRestore(); }} disabled={isRestoring}>
                {isRestoring ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin mr-2 shrink-0" />
                    Restoring…
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Restore
                  </>
                )}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePin(); }}>
                  {isPinnedView || note.pinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                  {isPinnedView || note.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/8"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modern delete confirmation */}
      {!isDeletedView && (
        <Dialog
          open={showDeleteDialog}
          onOpenChange={(o: boolean) => { if (!isDeleting) setShowDeleteDialog(o); }}
        >
          <DialogPortal>
            <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

            <div
              className={cn(
                "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                "w-[calc(100%-2rem)] max-w-[340px]",
                "bg-background rounded-2xl border border-border shadow-xl overflow-hidden",
                showDeleteDialog
                  ? "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  : "animate-out fade-out-0 zoom-out-95 duration-150"
              )}
            >
              {/* Accessible title/description for screen readers (visually hidden) */}
              <DialogTitle className="sr-only">Delete note</DialogTitle>
              <DialogDescription className="sr-only">
                Confirm deletion of {note.title || 'Untitled'}
              </DialogDescription>

              {/* Body */}
              <div className="flex flex-col items-center px-6 pt-7 pb-5 gap-4">
                <div
                  className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center"
                  style={{ animation: showDeleteDialog ? 'deleteShake 0.45s ease 0.1s both' : 'none' }}
                >
                  <Trash2 className="w-6 h-6 text-destructive" strokeWidth={1.75} />
                </div>

                <div className="text-center space-y-1.5">
                  <p className="text-[15px] font-semibold text-foreground leading-snug">
                    Delete note?
                  </p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">"{note.title || 'Untitled'}"</span>
                    {' '}will be permanently removed and cannot be recovered.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 px-6 pb-6">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className={cn(
                    "flex-1 h-10 rounded-xl border border-border text-[13px] font-medium",
                    "bg-background text-foreground",
                    "transition-all duration-150 hover:bg-accent active:scale-[0.97]",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    "flex-1 h-10 rounded-xl text-[13px] font-medium",
                    "bg-destructive text-destructive-foreground",
                    "transition-all duration-150 hover:bg-destructive/88 active:scale-[0.97]",
                    "disabled:opacity-70 disabled:pointer-events-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin shrink-0" />
                      Deleting…
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </DialogPortal>
        </Dialog>
      )}

      <style>{`
        @keyframes deleteShake {
          0%   { transform: rotate(0deg) scale(0.75); opacity: 0; }
          45%  { transform: rotate(-10deg) scale(1.08); opacity: 1; }
          65%  { transform: rotate(7deg) scale(1.03); }
          80%  { transform: rotate(-4deg) scale(1.01); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </>
  );
}