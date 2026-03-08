import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowRight, Loader2, Sparkles, Zap, Shield, Layers, PenTool, FolderOpen } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useAuthStore } from '../stores/newAuthStore';
import noteIcon from "../Icons/docspaceicon.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { login, signup } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          navigate('/');
        } else {
          toast({ title: "Invalid credentials", description: result.error, variant: "destructive" });
        }
      } else {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        const result = await signup(name, email, password);
        if (result.success) {
          navigate('/');
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: FolderOpen,
      label: "Organize",
      title: "Structure your thoughts",
      description: "Create categories, nest ideas, and build your personal knowledge base."
    },
    {
      icon: PenTool,
      label: "Write",
      title: "Capture instantly",
      description: "A distraction-free editor that gets out of your way when inspiration strikes."
    },
    {
      icon: Shield,
      label: "Access",
      title: "Always available",
      description: "Your notes sync seamlessly across all your devices, anytime."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[380px]">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-1">
              <img src={noteIcon} alt="" style={{ height: "30px", width: "30px" }} />
              <span className="text-xl font-semibold tracking-tight">DocSpace</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Enter your credentials to continue.' : 'Start organizing your thoughts.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required={!isLogin} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" required={!isLogin} />
              </div>
            )}

            <Button type="submit" className="w-full h-11 mt-2 font-medium" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isLogin ? 'Sign in' : 'Create account'}<ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-muted-foreground">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium text-foreground hover:text-brand ml-1.5 transition-colors">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 items-center justify-center p-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-background/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-2/3 left-1/3 w-48 h-48 bg-background/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          {/* Floating icons */}
          <div className="absolute top-20 right-20 opacity-20">
            <Sparkles className="w-8 h-8 text-background animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute bottom-32 left-20 opacity-20">
            <Zap className="w-6 h-6 text-background animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-1/2 right-16 opacity-20">
            <Layers className="w-7 h-7 text-background animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-lg w-full">
          {/* Feature indicator dots */}
          <div className="flex gap-2 mb-8">
            {features.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFeature(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeFeature
                  ? 'w-8 bg-background'
                  : 'w-1.5 bg-background/30 hover:bg-background/50'
                  }`}
              />
            ))}
          </div>

          {/* Feature cards */}
          <div className="relative h-[320px]">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = idx === activeFeature;
              const isPrev = idx === (activeFeature - 1 + 3) % 3;
              // const isNext = idx === (activeFeature + 1) % 3;

              return (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${isActive
                    ? 'opacity-100 translate-y-0 scale-100'
                    : isPrev
                      ? 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
                      : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                    }`}
                >
                  <div className="bg-background/10 backdrop-blur-sm border border-background/10 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-background" />
                      </div>
                      <span className="text-xs font-medium text-background/60 uppercase tracking-widest">
                        {feature.label}
                      </span>
                    </div>

                    <h2 className="text-3xl font-semibold text-background mb-4 tracking-tight">
                      {feature.title}
                    </h2>

                    <p className="text-background/70 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats or trust indicators */}
          {/* <div className="mt-12 pt-8 border-t border-background/10">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-semibold text-background">10k+</div>
                <div className="text-xs text-background/50 uppercase tracking-wider mt-1">Users</div>
              </div>
              <div className="w-px h-10 bg-background/10" />
              <div className="text-center">
                <div className="text-2xl font-semibold text-background">1M+</div>
                <div className="text-xs text-background/50 uppercase tracking-wider mt-1">Notes</div>
              </div>
              <div className="w-px h-10 bg-background/10" />
              <div className="text-center">
                <div className="text-2xl font-semibold text-background">99.9%</div>
                <div className="text-xs text-background/50 uppercase tracking-wider mt-1">Uptime</div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}