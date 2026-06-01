import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../../components/ui/input';
import { Icon } from '@iconify/react';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { cn } from '../../libs/utils';
import { Loader2 } from 'lucide-react';

const DEFAULT_ICONS = [
    'mdi:notebook-outline', 'mdi:note-text-outline', 'mdi:file-document-outline',
    'mdi:clipboard-text-outline', 'mdi:book-open-variant', 'mdi:bookshelf',
    'mdi:bookmark-outline', 'mdi:folder-outline', 'mdi:folder-star-outline',
    'mdi:archive-outline', 'mdi:inbox-outline', 'mdi:tag-outline',
    'mdi:briefcase-outline', 'mdi:calendar-outline', 'mdi:checkbox-marked-circle-outline',
    'mdi:format-list-checks', 'mdi:target', 'mdi:chart-line',
    'mdi:palette-outline', 'mdi:lightbulb-outline', 'mdi:pencil-outline',
    'mdi:code-tags', 'mdi:rocket-launch-outline', 'mdi:cog-outline',
    'mdi:heart-outline', 'mdi:home-outline', 'mdi:star-outline',
    'mdi:currency-usd', 'mdi:wallet-outline', 'mdi:chart-bar',
    'mdi:earth', 'mdi:flash-outline',
];

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [icons, setIcons] = useState<string[]>(DEFAULT_ICONS);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchIcons = useCallback(async (query: string) => {
        if (!query.trim()) {
            setIcons(DEFAULT_ICONS);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(
                `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=120`
            );
            const data = await res.json();
            setIcons(data.icons ?? []);
        } catch {
            setIcons([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchIcons(search), 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, searchIcons]);

    // Reset search when popover closes
    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-10 p-0 shrink-0" type="button">
                    <Icon icon={value || 'mdi:folder-outline'} className="w-5 h-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
                <div className="relative mb-2">
                    <Input
                        placeholder="Search any icon..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="h-8 text-sm pr-7"
                        autoFocus
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                </div>

                {!search.trim() && (
                    <p className="text-[11px] text-muted-foreground mb-2 px-0.5">
                        Popular icons · type to search millions more
                    </p>
                )}

                <ScrollArea className="h-52">
                    {!isLoading && icons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-1">
                            <p className="text-sm text-muted-foreground">No icons found</p>
                            <p className="text-xs text-muted-foreground/60">Try a different keyword</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-8 gap-1 pr-1">
                            {icons.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                        onChange(icon);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-accent",
                                        value === icon && "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                    title={icon}
                                >
                                    <Icon icon={icon} className="w-4.5 h-4.5" />
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
