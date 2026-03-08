import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
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
import { cn } from '../../libs/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useCategoryStore } from '../../stores/categoryStore';
import { Input } from '../ui/input';
import { useNotesStore } from '../../stores/notesStore';
import { Icon } from '@iconify/react';

interface SidebarCategoryItemProps {
  category: any;
}

export function SidebarCategoryItem({ category }: SidebarCategoryItemProps) {
  const { createNote } = useNotesStore();
  const { deleteCategory, getCategory } = useCategoryStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category._id,
    data: {
      type: 'category',
      category,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isUncategorized = category.category_name === "Uncategorised";

  const handleDelete = () => {
    deleteCategory(category._id);
    setShowDeleteDialog(false);
    getCategory();
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingNote(true);
    setNewNoteTitle('');
    setIsExpanded(true);
  };

  const handleCreateNote = () => {
    const title = newNoteTitle.trim() || 'Untitled';
    createNote(title, category._id);
    setIsCreatingNote(false);
    setNewNoteTitle('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNote();
    } else if (e.key === 'Escape') {
      setIsCreatingNote(false);
      setNewNoteTitle('');
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (isCreatingNote) {
        handleCreateNote();
      }
    }, 100);
  };

  useEffect(() => {
    if (isCreatingNote && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingNote]);

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

          <Icon
            icon={category.icon || (isUncategorized ? 'mdi:inbox-outline' : 'mdi:folder-outline')}
            className="w-4 h-4 shrink-0 text-muted-foreground"
          />

          <span className="flex-1 text-sm font-medium text-sidebar-foreground truncate">
            {category.category_name}
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
            {isCreatingNote && (
              <div className="ml-8 px-1 py-0.5">
                <Input
                  ref={inputRef}
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleInputBlur}
                  placeholder="Enter note title..."
                  className="h-7 text-sm bg-sidebar-accent border-primary/30 focus-visible:ring-primary/20"
                />
              </div>
            )}
            {category.notes?.map((note: any) => (
              <SidebarNoteItem key={note._id} note={note} />
            ))}

            {category.notes?.length === 0 && !isCreatingNote && (
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
              Are you sure you want to delete "{category.category_name}"? All notes in this
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
