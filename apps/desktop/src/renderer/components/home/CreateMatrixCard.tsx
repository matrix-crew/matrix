import React from 'react';
import { cn } from '@maxtix/ui';
import { Plus } from 'lucide-react';

export interface CreateMatrixCardProps {
  onClick: () => void;
  className?: string;
}

export const CreateMatrixCard: React.FC<CreateMatrixCardProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default p-8 transition-all',
        'text-text-muted hover:border-accent-lime hover:bg-accent-lime/5 hover:text-accent-lime',
        className
      )}
      aria-label="Create new matrix"
    >
      <div className="mb-2 rounded-full bg-base-700 p-3">
        <Plus className="size-5" />
      </div>
      <p className="text-sm font-medium">Create Matrix</p>
    </button>
  );
};

CreateMatrixCard.displayName = 'CreateMatrixCard';
