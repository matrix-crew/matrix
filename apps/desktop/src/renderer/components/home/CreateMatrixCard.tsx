import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export interface CreateMatrixCardProps {
  onClick: () => void;
  className?: string;
}

export const CreateMatrixCard: React.FC<CreateMatrixCardProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default p-10 transition-all',
        'text-text-muted hover:border-accent-lime hover:bg-accent-lime/5 hover:text-accent-lime',
        className
      )}
      aria-label="Create new matrix"
    >
      <div className="mb-3 rounded-full bg-base-700 p-3.5">
        <Plus className="size-6" />
      </div>
      <p className="text-[15px] font-medium">Create Matrix</p>
    </button>
  );
};

CreateMatrixCard.displayName = 'CreateMatrixCard';
