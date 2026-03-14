import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import type { Block, PartialBlock } from "@blocknote/core";
import { debounce } from 'lodash';
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { Clock, Copy, Download, FileText, MoreHorizontal, Pin, PinOff } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from '../ui/input';
import { useTheme } from '../../hooks/useTheme';
import { DropdownMenu, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCategoryStore } from '../../stores/categoryStore';
import { useNotesStore } from '../../stores/notesStore';

// Detect mobile browsers — covers iOS Safari, Android Chrome/Firefox, Samsung Browser
function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

export function NoteEditor() {
  const { categories } = useCategoryStore();
  const { selectedNoteId, updateNote, duplicateNote, getById, noteById } = useNotesStore();

  const [title, setTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const theme = useTheme();

  const editor = useCreateBlockNote();

  const isHydrating = useRef(false);
  // Holds a ref to the editor's DOM container so we can attach a paste listener
  const editorContainerRef = useRef<HTMLDivElement>(null);

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

  // ─── Mobile paste fix ────────────────────────────────────────────────────────
  //
  // Mobile browsers fire a ClipboardEvent where:
  //   - clipboardData.getData('text/html') is often empty (mobile doesn't write HTML to clipboard)
  //   - clipboardData.getData('text/plain') has the full text but mobile keyboards
  //     sometimes only deliver up to the first newline via the default handler
  //
  // Strategy:
  //   1. On mobile, intercept the paste event before BlockNote sees it.
  //   2. Read text/plain ourselves from the clipboard.
  //   3. Split on newlines → insert each non-empty line as a separate paragraph block.
  //   4. Call e.preventDefault() so BlockNote's default handler doesn't also run.
  //
  // On desktop we do nothing — BlockNote's built-in paste (which handles HTML, markdown,
  // and plain text) works correctly there.
  // ────────────────────────────────────────────────────────────────────────────

  const handleMobilePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!isMobileBrowser()) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // If there's HTML on the clipboard let BlockNote handle it — it's already rich
      const html = clipboardData.getData('text/html');
      if (html && html.trim().length > 0) return;

      const plainText = clipboardData.getData('text/plain');
      if (!plainText) return;

      // Split on any combination of \r\n, \r, or \n
      const lines = plainText.split(/\r\n|\r|\n/);

      // If it's a single line there's nothing to fix — let BlockNote handle it normally
      if (lines.length <= 1) return;

      // We're taking over — prevent BlockNote's default paste
      e.preventDefault();
      e.stopPropagation();

      // Build one paragraph block per non-empty line.
      // Empty lines between paragraphs become empty paragraph blocks (preserves spacing).
      const newBlocks: PartialBlock[] = lines.map((line) => ({
        type: 'paragraph',
        content: line.length > 0
          ? [{ type: 'text', text: line, styles: {} }]
          : [],
      }));

      // Insert after the currently focused block, or at the end if nothing is focused
      const currentBlock = editor.getTextCursorPosition().block;

      if (currentBlock) {
        // Check if the current block is empty — if so replace it, otherwise insert after
        const isCurrentBlockEmpty =
          !currentBlock.content ||
          (Array.isArray(currentBlock.content) && currentBlock.content.length === 0);

        if (isCurrentBlockEmpty) {
          editor.replaceBlocks([currentBlock], newBlocks);
        } else {
          editor.insertBlocks(newBlocks, currentBlock, 'after');
        }
      } else {
        // Fallback: append to end of document
        const lastBlock = editor.document[editor.document.length - 1];
        if (lastBlock) {
          editor.insertBlocks(newBlocks, lastBlock, 'after');
        }
      }

      // Trigger a save after the paste
      if (selectedNoteId) {
        debouncedSave(selectedNoteId, editor.document, title);
      }
    },
    [editor, selectedNoteId, title, debouncedSave]
  );

  // Attach the paste listener to the editor container.
  // We use `capture: true` so we intercept before BlockNote's own listener.
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    container.addEventListener('paste', handleMobilePaste, { capture: true });

    return () => {
      container.removeEventListener('paste', handleMobilePaste, { capture: true });
    };
  }, [handleMobilePaste]);

  const handleDuplicate = useCallback(() => {
    if (selectedNoteId) {
      duplicateNote(selectedNoteId);
    }
  }, [selectedNoteId, duplicateNote]);

  const handleExportPDF = useCallback(() => {
    console.log('Export to PDF');
  }, []);

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
      <div className="flex-1 flex items-center justify-center bg-background p-4">
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
      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6 group/header">
        {/* Top metadata row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
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
            className="text-xl sm:text-2xl lg:text-3xl font-bold border-none shadow-none px-3 sm:px-4 py-3 sm:py-4 h-auto focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground/40 tracking-tight" />
          {/* Animated underline */}
          <div
            className={`absolute -bottom-1 left-0 h-0.5 bg-border transition-all duration-300 ease-out ${isTitleFocused
              ? 'w-full bg-brand title-focus-underline'
              : 'w-0'
              }`}
          />
        </div>

        {/* Bottom metadata row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-5 gap-2 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {/* {noteById?.updated_at && ( */}
              <span>{formatDate(noteById?.updatedAt)}</span>
              {/* )} */}
            </span>
            <span className="hidden sm:inline text-border">•</span>
            {/* <span>words</span> */}
            <span className="hidden sm:inline text-border">•</span>
            <span className="hidden sm:inline">Created {formatDistanceToNow(new Date(selectedNote.createdAt), { addSuffix: true })}</span>
          </div>

          {/* Quick actions - visible on hover */}
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover/header:opacity-100 transition-opacity duration-200">
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
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Editor — ref attached here so the paste listener covers the whole editor area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div
          ref={editorContainerRef}
          className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-8"
        >
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
    </div>
  );
}