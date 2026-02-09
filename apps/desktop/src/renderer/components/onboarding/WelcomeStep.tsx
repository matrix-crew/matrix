import React from 'react';
import { Bot, FolderGit2, Workflow, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Connect Claude, Gemini, and Codex to supercharge your development',
  },
  {
    icon: FolderGit2,
    title: 'Workspaces',
    description: 'Organize repositories and sources into focused project spaces',
  },
  {
    icon: Workflow,
    title: 'Workflows',
    description: 'Build automated pipelines to streamline your development process',
  },
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center gap-10 animate-fade-in">
      {/* Matrix grid logo */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-accent-cyan/20 bg-gradient-to-br from-accent-cyan/20 to-accent-lime/10">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-sm bg-accent-cyan"
              style={{ opacity: 0.3 + (i % 3) * 0.25 }}
            />
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary">Welcome to Matrix</h1>
        <p className="mt-3 max-w-md text-base text-text-secondary">
          Your AI-powered development workspace. Connect agents, organize sources, and build
          powerful workflows.
        </p>
      </div>

      {/* Feature cards */}
      <div className="flex gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex w-48 flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-700">
              <feature.icon className="size-5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">{feature.title}</h3>
              <p className="mt-1 text-xs text-text-muted">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Get Started button */}
      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 rounded-lg bg-accent-cyan px-6 py-3 text-sm font-semibold text-base-900 transition-all hover:bg-accent-cyan/90 hover:shadow-lg hover:shadow-accent-cyan/20"
      >
        Get Started
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
};

WelcomeStep.displayName = 'WelcomeStep';
