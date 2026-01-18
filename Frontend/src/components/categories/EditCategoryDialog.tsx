import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../libs/utils';
import { Button } from '../ui/button';
import { useCategoryStore } from '../../stores/categoryStore';


interface EditCategoryDialogProps {
  category: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  { name: 'gray', class: 'bg-note-gray' },
  { name: 'red', class: 'bg-note-red' },
  { name: 'orange', class: 'bg-note-orange' },
  { name: 'yellow', class: 'bg-note-yellow' },
  { name: 'green', class: 'bg-note-green' },
  { name: 'blue', class: 'bg-note-blue' },
  { name: 'purple', class: 'bg-note-purple' },
  { name: 'pink', class: 'bg-note-pink' },
];

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const { updateCategory } = useCategoryStore()
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);

  useEffect(() => {
    if (open) {
      setName(category.name);
      setColor(category.color);
    }
  }, [open, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateCategory(category.id, name.trim(), color);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      c.class,
                      color === c.name
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name?.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
