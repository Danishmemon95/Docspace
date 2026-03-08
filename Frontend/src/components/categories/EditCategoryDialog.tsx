import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useCategoryStore } from '../../stores/categoryStore';
import { IconPicker } from './IconPicker';
import { Label } from '../ui/label';

interface EditCategoryDialogProps {
  category: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const { updateCategory } = useCategoryStore()
  const [name, setName] = useState(category.category_name);
  const [icon, setIcon] = useState(category.icon);

  console.log("category", category)

  useEffect(() => {
    if (open) {
      setName(category.category_name);
      setIcon(category.icon || 'mdi:folder-outline');
    }
  }, [open, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateCategory(category._id, name.trim(), icon);
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
              <Label htmlFor="name">Name</Label>

              <div className="flex gap-2 items-center">
                <IconPicker value={icon} onChange={setIcon} />
                <Input
                  id="edit-name"
                  placeholder="Category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="flex-1"
                />
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
