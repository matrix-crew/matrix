import React from 'react';
import { Bot, Lightbulb, Columns3, Workflow, GitFork, Activity, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Bot,
    title: 'Agents',
    description: 'Connect multiple AI agents to accelerate your development',
  },
  {
    icon: Lightbulb,
    title: 'Ideation',
    description: 'Structure your ideas and turn them into actionable plans',
  },
  {
    icon: Columns3,
    title: 'Kanban',
    description: 'Manage task flow with intuitive visual boards',
  },
  {
    icon: Workflow,
    title: 'Pipeline',
    description: 'Automate workflows and eliminate repetitive tasks',
  },
  {
    icon: GitFork,
    title: 'Worktree',
    description: 'Every task runs in parallel within its own isolated space',
  },
  {
    icon: Activity,
    title: 'Monitoring',
    description: 'Track project status and progress in real time',
  },
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="my-auto flex flex-col items-center gap-10 animate-fade-in">
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
          A new way to work with AI. Let agents think, plan, and build alongside you — so you can
          focus on what truly matters.
        </p>
      </div>

      {/* Feature cards – 3×2 grid */}
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="flex w-44 flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-5 text-center opacity-0"
            style={{
              animation: `slide-in 0.4s ease-out ${0.08 * index}s forwards`,
            }}
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
