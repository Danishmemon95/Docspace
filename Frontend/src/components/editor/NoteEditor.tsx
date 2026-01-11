import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNotesStore } from '../../stores/notesStore';
import { Input } from '../ui/input';
import { useTheme } from '../../hooks/useTheme';

export function NoteEditor() {
  const { notes, selectedNoteId, updateNote } = useNotesStore();
  const [title, setTitle] = useState('');
  const theme = useTheme()

  const editor = useCreateBlockNote();

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId),
    [notes, selectedNoteId]
  );

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
    }
  }, [selectedNote]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (selectedNoteId) {
        updateNote(selectedNoteId, { title: newTitle });
      }
    },
    [selectedNoteId, updateNote]
  );

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
      {/* Header */}
      <div className="px-12 pt-12 pb-6 border-b border-border">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="text-3xl font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground/40 tracking-tight"
        />
        <p className="text-xs text-muted-foreground mt-3">
          Last edited {format(new Date(selectedNote.updatedAt), 'MMM d, yyyy · h:mm a')}
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-12 py-8">

          {/* <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="w-full min-h-[calc(100vh-280px)] resize-none border-none shadow-none focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground/40 text-base leading-relaxed"
          /> */}

          <BlockNoteView editor={editor} theme={theme.theme === "dark" ? darkDefaultTheme : lightDefaultTheme} />

        </div>
      </div>
    </div>
  );
}
