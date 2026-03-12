import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, MoreHorizontal, Trash2, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { useState } from 'react';
import { cn } from '../../libs/utils';
import { useNotesStore } from '../../stores/notesStore';
import type { Note } from '../../Types/Note';
import { useIsMobile } from '../../hooks/use-mobile';

export function SidebarNoteItem({ note }: { note: Note }) {
  const { selectedNoteId, setSelectedNote, deleteNote, duplicateNote, toggleSidebar } = useNotesStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    data: {
      type: 'note',
      note,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = selectedNoteId === note._id;

  const handleDelete = () => {
    deleteNote(note._id);
    setShowDeleteDialog(false);
  };

  const handleDuplicate = () => {
    duplicateNote(note._id);
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
          setSelectedNote(note._id);
          if (isMobile) toggleSidebar();
        }}
      >
        <button
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate flex-1">{note.title || 'Untitled'}</span>

        {/* Three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note.title || 'Untitled'}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
