import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore, type ThemeMode } from '../../stores/notesStore';
import { Camera, Check, LogOut, Monitor, Moon, Palette, Sun, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../libs/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Clean & bright' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Match device' },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const navigate = useNavigate();
  const { profile, updateProfile } = useNotesStore();
  const { logout, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const handleSaveProfile = () => {
    updateProfile({ name, email });
    toast({ title: 'Profile updated', description: 'Your changes have been saved' });
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
    toast({ title: 'Logged out', description: 'You have been logged out successfully' });
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl h-11">
              <TabsTrigger 
                value="profile" 
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="profile" className="mt-0 p-6 pt-6 space-y-6 animate-fade-in">
            {/* Avatar section */}
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-muted">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                  <Camera className="w-4 h-4" />
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>
            
            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-foreground font-medium">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-11 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full h-11 rounded-xl font-semibold">
              Save Changes
            </Button>

            {/* Logout section */}
            {isAuthenticated && (
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-0 p-6 pt-6 space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground font-medium">Theme</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose your preferred color scheme
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = theme === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        isActive
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isActive ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="text-center">
                        <span className={cn(
                          "text-sm font-medium block",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview section */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Theme changes are applied instantly across the app.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}