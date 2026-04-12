import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AISecurityGuard() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'active' | 'scanning' | 'alert'>('active');

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80"
          >
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">AI Security Guard</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Real-time content protection powered by Gemini AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1.5 text-green-500 font-medium">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Active & Protecting
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Scan</span>
                    <span>Just now</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Threats Blocked</span>
                    <span className="font-mono">0 today</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-primary mt-0.5" />
                    <p className="leading-relaxed">
                      All comments and posts are automatically scanned for spam, hate speech, and malicious content.
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full text-xs h-8" onClick={() => setIsOpen(false)}>
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Shield className="h-5 w-5" />
        <span className="font-medium text-sm">AI Protected</span>
      </motion.button>
    </div>
  );
}
