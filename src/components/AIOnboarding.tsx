import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, User, FileText, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Step {
  title: string;
  description: string;
  icon: any;
  action: string;
}

const steps: Step[] = [
  {
    title: "Welcome, Author!",
    description: "I'm your AI assistant. Let's get your blog set up in 3 easy steps.",
    icon: Sparkles,
    action: "Start Tour"
  },
  {
    title: "Complete Your Profile",
    description: "Authors with complete profiles get 40% more engagement. Add your bio and social links.",
    icon: User,
    action: "Go to Profile"
  },
  {
    title: "Create Your First Story",
    description: "Use our AI tools to suggest tags and analyze your content quality as you write.",
    icon: FileText,
    action: "Open Editor"
  },
  {
    title: "Configure Site Settings",
    description: "Customize your blog's name, colors, and notice board from the settings tab.",
    icon: Settings,
    action: "View Settings"
  }
];

export default function AIOnboarding({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('ai_onboarding_complete');
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('ai_onboarding_complete', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-2xl border-primary/20">
          <CardHeader className="relative pb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 h-8 w-8" 
              onClick={completeOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-4 rounded-full transition-colors ${i === currentStep ? 'bg-primary' : 'bg-muted'}`} 
                  />
                ))}
              </div>
            </div>
            <CardTitle className="text-2xl">{step.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={completeOnboarding}>
                Skip
              </Button>
              <Button className="flex-1 gap-2" onClick={handleNext}>
                {step.action} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {currentStep === steps.length - 1 && (
              <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                You're ready to start your journey!
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
