import { useState, useMemo } from 'react';
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
const PRESET_ICONS = [
    // Documents & Notes
    'mdi:notebook-outline',
    'mdi:note-text-outline',
    'mdi:file-document-outline',
    'mdi:clipboard-text-outline',
    'mdi:book-open-variant',
    'mdi:bookshelf',
    'mdi:bookmark-outline',
    'mdi:newspaper-variant-outline',
    // Organization
    'mdi:folder-outline',
    'mdi:folder-star-outline',
    'mdi:archive-outline',
    'mdi:inbox-outline',
    'mdi:tag-outline',
    'mdi:label-outline',
    'mdi:filter-outline',
    'mdi:sort-variant',
    // Work & Productivity
    'mdi:briefcase-outline',
    'mdi:calendar-outline',
    'mdi:clock-outline',
    'mdi:checkbox-marked-circle-outline',
    'mdi:format-list-checks',
    'mdi:target',
    'mdi:trophy-outline',
    'mdi:chart-line',
    // Communication
    'mdi:email-outline',
    'mdi:chat-outline',
    'mdi:phone-outline',
    'mdi:bell-outline',
    'mdi:megaphone-outline',
    'mdi:forum-outline',
    'mdi:account-group-outline',
    'mdi:handshake-outline',
    // Creative
    'mdi:palette-outline',
    'mdi:brush-outline',
    'mdi:camera-outline',
    'mdi:music-note-outline',
    'mdi:movie-outline',
    'mdi:lightbulb-outline',
    'mdi:pencil-outline',
    'mdi:creation',
    // Tech
    'mdi:code-tags',
    'mdi:database-outline',
    'mdi:server-outline',
    'mdi:bug-outline',
    'mdi:rocket-launch-outline',
    'mdi:cog-outline',
    'mdi:wrench-outline',
    'mdi:desktop-mac',
    // Health & Lifestyle
    'mdi:heart-outline',
    'mdi:food-apple-outline',
    'mdi:dumbbell',
    'mdi:meditation',
    'mdi:home-outline',
    'mdi:car-outline',
    'mdi:airplane-outline',
    'mdi:earth',
    // Finance
    'mdi:currency-usd',
    'mdi:wallet-outline',
    'mdi:credit-card-outline',
    'mdi:bank-outline',
    'mdi:chart-bar',
    'mdi:cash-multiple',
    'mdi:receipt-text-outline',
    'mdi:calculator-variant-outline',
    // Misc
    'mdi:star-outline',
    'mdi:flag-outline',
    'mdi:pin-outline',
    'mdi:link-variant',
    'mdi:shield-outline',
    'mdi:lock-outline',
    'mdi:eye-outline',
    'mdi:flash-outline',
];
interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}
export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filteredIcons = useMemo(() => {
        if (!search.trim()) return PRESET_ICONS;
        const q = search.toLowerCase();
        return PRESET_ICONS.filter((icon) => icon.toLowerCase().includes(q));
    }, [search]);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-10 w-10 p-0"
                    type="button"
                >
                    <Icon icon={value || 'mdi:folder-outline'} className="w-5 h-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
                <Input
                    placeholder="Search icons..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="mb-2 h-8 text-sm"
                    autoFocus
                />
                <ScrollArea className="h-48">
                    <div className="grid grid-cols-8 gap-1">
                        {filteredIcons.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                    onChange(icon);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-accent",
                                    value === icon && "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                                title={icon.replace('mdi:', '')}
                            >
                                <Icon icon={icon} className="w-4.5 h-4.5" />
                            </button>
                        ))}
                    </div>
                    {filteredIcons.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            No icons found
                        </p>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
