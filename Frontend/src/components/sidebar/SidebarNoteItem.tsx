import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical } from 'lucide-react';
import { type Note, useNotesStore } from '../../stores/notesStore';
import { cn } from '../../libs/utils';

interface SidebarNoteItemProps {
  note: Note;
}

export function SidebarNoteItem({ note }: SidebarNoteItemProps) {
  const { selectedNoteId, setSelectedNote } = useNotesStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: note.id,
    data: {
      type: 'note',
      note,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = selectedNoteId === note.id;

  return (
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
      onClick={() => setSelectedNote(note.id)}
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
    </div>
  );
}
