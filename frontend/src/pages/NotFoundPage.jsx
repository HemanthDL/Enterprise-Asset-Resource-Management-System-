import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, AlertTriangle, ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 text-center">
      <Card className="max-w-md w-full border-primary/25 shadow-xl relative overflow-hidden bg-card/60 backdrop-blur-md">
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-destructive/10 rounded-full blur-xl pointer-events-none"></div>
        
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="p-4 bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-destructive border border-destructive/20 animate-bounce">
            <Compass className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
            <h2 className="text-xl font-bold text-foreground">You've Landed in the Wrong Zone!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
              Whoops! It looks like you've wandered off the grid. Even our state-of-the-art asset tracking system can't locate this page. Let's get you back to safety.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              className="w-full shadow-lg group hover:scale-[1.02] transition-transform duration-200"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
