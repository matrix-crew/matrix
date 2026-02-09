import React from 'react';
import { cn } from '@/lib/utils';
import { Grid3X3, Plus } from 'lucide-react';

export interface OnboardingViewProps {
  onCreateMatrix: () => void;
  className?: string;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onCreateMatrix, className }) => {
  return (
    <div
      className={cn('flex h-full flex-col items-center justify-center animate-fade-in', className)}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-base-700">
          <Grid3X3 className="size-10 text-accent-cyan" />
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-primary">Create your first Matrix</h1>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            Matrices organize your sources, workflows, and agents into focused workspaces.
          </p>
        </div>

        {/* Create button */}
        <button
          type="button"
          onClick={onCreateMatrix}
          className="flex items-center gap-2 rounded-lg bg-accent-cyan px-5 py-2.5 text-sm font-medium text-base-900 transition-colors hover:bg-accent-cyan/90"
        >
          <Plus className="size-4" />
          New Matrix
        </button>
      </div>
    </div>
  );
};

OnboardingView.displayName = 'OnboardingView';
