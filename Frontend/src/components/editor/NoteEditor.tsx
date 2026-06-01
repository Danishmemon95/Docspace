import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import { debounce } from 'lodash';
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { Clock, Copy, Download, FileText, Loader2, MoreHorizontal, Pin, PinOff } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from '../ui/input';
import { useTheme } from '../../hooks/useTheme';
import { DropdownMenu, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Button } from '../ui/button';
import { useCategoryStore } from '../../stores/categoryStore';
import { useNotesStore } from '../../stores/notesStore';
import { NoteEditorSkeleton } from './NoteEditorSkeleton';

export function NoteEditor() {
  const { categories } = useCategoryStore();
  const { selectedNoteId, updateNote, duplicateNote, getById, noteById, isLoadingNote, togglePin } = useNotesStore();

  const [title, setTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // resolvedTheme is 'light' | 'dark' — reacts to system changes AND manual changes
  const { resolvedTheme } = useTheme();

  const editor = useCreateBlockNote();

  const isHydrating = useRef(false);

  const selectedNote = useMemo(() => {
    return categories
      .flatMap((c: any) => c.notes)
      .find((n: any) => n._id === selectedNoteId);
  }, [categories, selectedNoteId]);

  // Fetch full note content whenever the selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      getById(selectedNoteId);
    }
  }, [selectedNoteId]);

  // Hydrate the editor with stored blocks once the note is fetched
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

  // Debounced silent save — no loading state triggered here
  const debouncedSave = useMemo(
    () =>
      debounce((id: string, blocks: Block[], title: string) => {
        if (!selectedNoteId) return;
        updateNote(id, blocks, title);
      }, 800),
    [selectedNoteId]
  );

  const noteCategory = useMemo(
    () => categories.find((c: any) => c._id === selectedNote?.categoryId),
    [categories, selectedNote?.categoryId]
  );

  const handleExportPDF = useCallback(async () => {
    if (!selectedNote || isExportingPDF) return;

    setIsExportingPDF(true);

    try {
      const [{ PDFExporter, pdfDefaultSchemaMappings }, ReactPDF] = await Promise.all([
        import('@blocknote/xl-pdf-exporter'),
        import('@react-pdf/renderer'),
      ]);

      const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);
      const pdfDocument = await exporter.toReactPDFDocument(editor.document);
      const blob = await ReactPDF.pdf(pdfDocument).toBlob();

      const safeTitle = (title || 'note')
        .trim()
        .replace(/[^a-z0-9\s\-_]/gi, '')
        .replace(/\s+/g, '_') || 'note';

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeTitle}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [editor, selectedNote, title, isExportingPDF]);

  const handleDuplicate = useCallback(() => {
    if (selectedNoteId) {
      duplicateNote(selectedNoteId);
    }
  }, [selectedNoteId, duplicateNote]);

  const handleTogglePin = useCallback(async () => {
    if (!selectedNoteId || !selectedNote) return;
    await togglePin(selectedNoteId);
  }, [selectedNoteId, selectedNote, togglePin]);

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

  // Cancel pending debounce when switching notes
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [selectedNoteId]);

  const formatDate = (date?: string) =>
    date ? format(new Date(date), "MMM d, yyyy · h:mm a") : "—";

  // ── Empty state ──────────────────────────────────────────────────────────────
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

  // ── Skeleton — only while fetching on open / switch ──────────────────────────
  if (isLoadingNote) {
    return <NoteEditorSkeleton />;
  }

  // ── Real editor ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">

      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pt-5 pb-0 group/header">

        {/* Meta row: category badge + pinned indicator */}
        <div className="flex items-center gap-2 h-[22px] mb-2.5">
          {noteCategory && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              <span className="w-[7px] h-[7px] rounded-full bg-violet-500 shrink-0" />
              {noteCategory.category_name}
            </span>
          )}
          {selectedNote.pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-1.5 py-0.5 rounded-full border border-border">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
        </div>

        {/* Title input */}
        <div className="relative">
          <Input
            value={title}
            onChange={handleTitleChange}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            placeholder="Untitled"
            className="text-[32px] sm:text-2xl md:text-3xl font-medium border-none shadow-none px-2 py-1 h-auto focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground/30 tracking-tight leading-snug"
          />
          <div
            className={`absolute bottom-0 left-0 h-[1.5px] rounded-full bg-foreground/40 transition-all duration-250 ease-out ${isTitleFocused ? 'w-full' : 'w-0'
              }`}
          />
        </div>

        {/* Timestamps + action buttons */}
        <div className="flex items-center justify-between py-2 gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDate(noteById?.updatedAt)}
            </span>
            <span className="text-border text-[10px]">·</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Created {formatDistanceToNow(new Date(selectedNote.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Actions — fade in on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={selectedNote.pinned ? 'Unpin' : 'Pin'}
              onClick={handleTogglePin}
            >
              {selectedNote.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleDuplicate}
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleExportPDF}
              title="Export PDF"
            >
              {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-12 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-8">
          <BlockNoteView
            key={resolvedTheme}
            editor={editor}
            theme={resolvedTheme === 'dark' ? "dark" : "light"}
            // theme={resolvedTheme === 'dark' ? darkDefaultTheme : lightDefaultTheme}
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