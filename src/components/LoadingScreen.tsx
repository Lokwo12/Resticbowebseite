import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center gap-3.5 p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-wider uppercase">
          {message}
        </p>
      </div>
    </div>
  );
}
