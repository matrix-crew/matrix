import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

interface PathInputProps {
  detectedPath?: string;
  customPath?: string;
  validating?: boolean;
  validationError?: string;
  onPathChange: (path: string | undefined) => void;
  onValidate: (path: string) => void;
}

export const PathInput: React.FC<PathInputProps> = ({
  detectedPath,
  customPath,
  validating,
  validationError,
  onPathChange,
  onValidate,
}) => {
  const [inputValue, setInputValue] = useState(customPath ?? '');

  // Sync if customPath is cleared externally
  useEffect(() => {
    setInputValue(customPath ?? '');
  }, [customPath]);

  const handleBlur = () => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== detectedPath) {
      onValidate(trimmed);
    } else if (!trimmed) {
      onPathChange(undefined);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onPathChange(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const showSuccess = !validating && inputValue.trim() && !validationError && customPath;

  return (
    <div className="mt-1">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={detectedPath || '/path/to/executable'}
          disabled={validating}
          className={cn(
            'w-full rounded-md border bg-base-800 px-2.5 py-1.5 pr-16 font-mono text-xs text-text-primary transition-colors',
            'placeholder:text-text-muted/60',
            'focus:outline-none focus:ring-1',
            validationError
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
              : 'border-border-subtle focus:border-accent-cyan focus:ring-accent-cyan/30',
            validating && 'opacity-60'
          )}
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {validating && <Loader2 className="size-3.5 animate-spin text-text-muted" />}
          {showSuccess && <CheckCircle2 className="size-3.5 text-accent-lime" />}
          {!validating && validationError && <XCircle className="size-3.5 text-red-400" />}
          {inputValue && !validating && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-text-muted transition-colors hover:bg-base-700 hover:text-text-secondary"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {validationError && <p className="mt-1 text-xs text-red-400">{validationError}</p>}
    </div>
  );
};
