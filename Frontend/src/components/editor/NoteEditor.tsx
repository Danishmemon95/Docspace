import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import { debounce } from 'lodash';
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { Clock, Copy, Download, FileText, MoreHorizontal, Pin, PinOff } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from '../ui/input';
import { useTheme } from '../../hooks/useTheme';
import { DropdownMenu, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
// import { DropdownMenuContent, DropdownMenuItem, } from '@radix-ui/react-dropdown-menu';
import { Button } from '../ui/button';
// import { DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { useCategoryStore } from '../../stores/categoryStore';
import { useNotesStore } from '../../stores/notesStore';

export function NoteEditor() {
  const { categories } = useCategoryStore()
  const { selectedNoteId, updateNote, duplicateNote, getById, noteById } = useNotesStore()

  const [title, setTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const theme = useTheme()

  console.log("theme", theme)

  const editor = useCreateBlockNote();

  const isHydrating = useRef(false);

  const selectedNote = useMemo(() => {
    return categories
      .flatMap(c => c.notes)
      .find(n => n._id === selectedNoteId);
  }, [categories, selectedNoteId]);

  useEffect(() => {
    if (selectedNoteId) {
      getById(selectedNoteId);
    }
  }, [selectedNoteId]);

  useEffect(() => {
    if (!noteById?.content) return;

    isHydrating.current = true;

    editor.replaceBlocks(
      editor.document,
      noteById.content as Block[]
    );

    setTimeout(() => {
      isHydrating.current = false;
    }, 0);
  }, [selectedNoteId, noteById?._id]);

  const debouncedSave = useMemo(
    () =>
      debounce((id: string, blocks: Block[], title: string) => {
        if (!selectedNoteId) return;

        updateNote(id, blocks, title);
      }, 800),
    [selectedNoteId]
  );

  const noteCategory = useMemo(
    () => categories.find((c) => c._id === selectedNote?.categoryId),
    [categories, selectedNote?.categoryId]
  );

  const noteContent = useMemo(() => {
    return noteById?.content || [];
  }, [noteById]);

  console.log("noteById", noteById)

  console.log("noteContent", noteContent)

  // const handleTogglePin = useCallback(() => {
  //   if (selectedNoteId && selectedNote) {
  //     updateNote(selectedNoteId, selectedNote.content, selectedNote.title);
  //   }
  // }, [selectedNoteId, selectedNote, updateNote]);

  const handleDuplicate = useCallback(() => {
    if (selectedNoteId) {
      duplicateNote(selectedNoteId);
    }
  }, [selectedNoteId, duplicateNote]);

  const handleExportPDF = useCallback(() => {
    // TODO: Implement PDF export
    console.log('Export to PDF');
  }, []);

  // const handleDelete = useCallback(() => {
  //   if (selectedNoteId) {
  //     deleteNote(selectedNoteId);
  //   }
  // }, [selectedNoteId, deleteNote]);

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
    }
  }, [selectedNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (!selectedNoteId) return;
    debouncedSave(selectedNoteId, editor.document, newTitle);
  };


  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [selectedNoteId]);

  const formatDate = (date?: string) =>
    date ? format(new Date(date), "MMM d, yyyy · h:mm a") : "—";

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1.5">No note selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a note from the sidebar or create a new one to start writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Enhanced Header */}
      <div className="px-12 pt-10 pb-6 group/header">
        {/* Top metadata row */}
        <div className="flex items-center gap-3 mb-4">
          {noteCategory && (
            <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: `hsl(var(--note-${'gray'}))` }}
              />
              {noteCategory.category_name}
            </Badge>
          )}
          {/* {selectedNote.pinned && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Pin className="w-3 h-3" />
              Pinned
            </Badge>
          )} */}
        </div>

        {/* Title with enhanced styling */}
        <div className="relative">
          <Input
            value={title}
            onChange={handleTitleChange}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            placeholder="Untitled"
            className="text-4xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground/30 tracking-tight"
          />
          {/* Animated underline */}
          <div
            className={`absolute -bottom-1 left-0 h-0.5 bg-border transition-all duration-300 ease-out ${isTitleFocused
              ? 'w-full bg-brand title-focus-underline'
              : 'w-0'
              }`}
          />
        </div>

        {/* Bottom metadata row */}
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {/* {noteById?.updated_at && ( */}
              <span>{formatDate(noteById?.updatedAt)}</span>
              {/* )} */}
            </span>
            <span className="text-border">•</span>
            {/* <span>words</span> */}
            <span className="text-border">•</span>
            {noteById?.createdAt && (
              <span>
                Created{" "}
                {formatDistanceToNow(new Date(noteById.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}          </div>

          {/* Quick actions - visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              // onClick={handleTogglePin}
              title={selectedNote.pinned ? 'Unpin note' : 'Pin note'}
            >
              {selectedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDuplicate}
              title="Duplicate note"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleExportPDF}
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              {/* <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Move to category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete note
                </DropdownMenuItem>
              </DropdownMenuContent> */}
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />


      {/* Editor */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-12 py-8">
          <BlockNoteView
            editor={editor}
            theme={
              theme.resolvedTheme === 'dark'
                ? darkDefaultTheme
                : lightDefaultTheme
            }
            onChange={() => {
              if (isHydrating.current) return;
              if (!selectedNoteId) return;
              debouncedSave(selectedNoteId, editor.document, title);
            }}
          />
        </div>
      </div>
    </div >
  );
}
