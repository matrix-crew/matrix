import * as React from 'react';
import { cn } from '@maxtix/ui';
import type { AppearanceMode, ColorTheme } from '@maxtix/shared';
import { useTheme } from '@/contexts/ThemeProvider';

// ─── Appearance Mode ──────────────────────────────────────────────────

interface ModeOption {
  id: AppearanceMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const APPEARANCE_MODES: ModeOption[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Light background with dark text',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.591 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dark background with light text',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follows your OS preference',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path
          fillRule="evenodd"
          d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

// ─── Color Theme Card ─────────────────────────────────────────────────

const ColorThemeCard: React.FC<{
  theme: ColorTheme;
  isActive: boolean;
  onClick: () => void;
}> = ({ theme, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex flex-col items-start gap-2 rounded-lg border p-3 transition-all',
      isActive
        ? 'border-accent-cyan ring-2 ring-accent-cyan/30 bg-base-700'
        : 'border-border-default bg-base-800 hover:border-base-400'
    )}
  >
    {/* Color preview swatch row */}
    <div className="flex items-center gap-1.5">
      <span
        className="h-5 w-5 rounded-full border border-white/10"
        style={{ backgroundColor: theme.preview.bg }}
      />
      <span
        className="h-5 w-5 rounded-full border border-white/10"
        style={{ backgroundColor: theme.preview.accent }}
      />
      <span className="h-3 w-8 rounded-sm" style={{ backgroundColor: theme.preview.text }} />
    </div>
    <div className="text-left">
      <span className="text-xs font-medium text-text-primary">{theme.name}</span>
      <p className="text-[10px] text-text-muted leading-tight">{theme.description}</p>
    </div>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────

export interface AppearanceSectionProps {
  className?: string;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({ className }) => {
  const { appearanceMode, colorThemeId, setAppearanceMode, setColorTheme, themes } = useTheme();

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Appearance Settings">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
        <p className="mt-1 text-sm text-text-secondary">Customize how Matrix looks and feels</p>
      </div>

      {/* Appearance Mode */}
      <div className="rounded-lg border border-border-default bg-surface-raised p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-text-primary">Appearance Mode</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Choose light, dark, or follow your system
          </p>
        </div>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Appearance mode">
          {APPEARANCE_MODES.map((mode) => {
            const isActive = appearanceMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAppearanceMode(mode.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-5 py-3 transition-all min-w-[100px]',
                  isActive
                    ? 'border-accent-cyan ring-2 ring-accent-cyan/30 bg-base-700 text-accent-cyan'
                    : 'border-border-default bg-base-800 text-text-muted hover:border-base-400 hover:text-text-secondary'
                )}
                aria-pressed={isActive}
                role="radio"
                aria-checked={isActive}
              >
                {mode.icon}
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Theme */}
      <div className="rounded-lg border border-border-default bg-surface-raised p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-text-primary">Color Theme</h3>
          <p className="mt-0.5 text-xs text-text-muted">Select a color palette for the interface</p>
        </div>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Color theme">
          {themes.map((theme) => (
            <ColorThemeCard
              key={theme.id}
              theme={theme}
              isActive={colorThemeId === theme.id}
              onClick={() => setColorTheme(theme.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

AppearanceSection.displayName = 'AppearanceSection';

export { AppearanceSection };
