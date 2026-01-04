import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Folder,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Inbox,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { EditCategoryDialog } from '../../components/categories/EditCategoryDialog';
import { SidebarNoteItem } from './SidebarNoteItem';
import { useNotesStore, type Category } from '../../stores/notesStore';
import { cn } from '../../libs/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface SidebarCategoryItemProps {
  category: Category;
}

const colorClasses: Record<string, string> = {
  red: 'text-note-red',
  orange: 'text-note-orange',
  yellow: 'text-note-yellow',
  green: 'text-note-green',
  blue: 'text-note-blue',
  purple: 'text-note-purple',
  pink: 'text-note-pink',
  gray: 'text-note-gray',
};

export function SidebarCategoryItem({ category }: SidebarCategoryItemProps) {
  const { notes, deleteCategory, addNote } = useNotesStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: category.id,
    data: {
      type: 'category',
      category,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const categoryNotes = notes.filter(
    (n) => n.categoryId === category.id && !n.archived
  );

  const isUncategorized = category.id === 'uncategorized';

  const handleDelete = () => {
    deleteCategory(category.id);
    setShowDeleteDialog(false);
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNote(category.id);
    setIsExpanded(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group",
          isDragging && "opacity-50"
        )}
      >
        {/* Category header - same layout for all categories */}
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
          <button
            className={cn(
              "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 transition-opacity",
              isUncategorized ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          
          <button
            className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          {isUncategorized ? (
            <Inbox className={cn("w-4 h-4 shrink-0", colorClasses[category.color])} />
          ) : (
            <Folder className={cn("w-4 h-4 shrink-0", colorClasses[category.color])} />
          )}
          
          <span className="flex-1 text-sm font-medium text-sidebar-foreground truncate">
            {category.name}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={handleAddNote}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>

          {!isUncategorized && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Notes list - droppable area */}
        {isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {categoryNotes.map((note) => (
              <SidebarNoteItem key={note.id} note={note} />
            ))}
            
            {categoryNotes.length === 0 && (
              <div className="ml-8 px-3 py-1.5 text-xs text-muted-foreground/60 italic">
                No notes
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{category.name}"? All notes in this
              category will be moved to Uncategorized.
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

      <EditCategoryDialog
        category={category}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
