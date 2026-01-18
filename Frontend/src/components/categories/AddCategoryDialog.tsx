import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { cn } from '../../libs/utils';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useCategoryStore } from '../../stores/categoryStore';

interface AddCategoryDialogProps {
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

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const { createCategory } = useCategoryStore()
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createCategory(name.trim(), color);
      setName('');
      setColor('blue');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
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
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
