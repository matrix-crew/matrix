import * as React from 'react';
import { cn } from '@/lib/utils';
import type { GitHubStatus } from '@/hooks/useGitHubData';

export interface GitHubSetupPromptProps {
  status: GitHubStatus;
  isCheckingStatus: boolean;
  onRetry: () => void;
  className?: string;
}

/**
 * Prompt shown when gh CLI is not installed or not authenticated.
 * Provides install/auth instructions inline within the Issues/PRs views.
 */
export const GitHubSetupPrompt: React.FC<GitHubSetupPromptProps> = ({
  status,
  isCheckingStatus,
  onRetry,
  className,
}) => {
  if (isCheckingStatus) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Checking GitHub CLI status...</p>
        </div>
      </div>
    );
  }

  const isNotInstalled = !status.installed;
  const isNotAuthenticated = status.installed && !status.authenticated;

  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-gray-400 dark:text-gray-500"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isNotInstalled ? 'GitHub CLI Required' : 'GitHub Authentication Required'}
        </h3>

        {/* Description */}
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {isNotInstalled
            ? 'The GitHub CLI (gh) is required to view Issues and Pull Requests. Install it to get started.'
            : 'You need to authenticate with GitHub CLI to access your repositories.'}
        </p>

        {/* Instructions */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-900">
          {isNotInstalled ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Install gh CLI
              </p>
              <div className="space-y-2">
                <CodeBlock label="macOS (Homebrew)">brew install gh</CodeBlock>
                <CodeBlock label="Windows (Scoop)">scoop install gh</CodeBlock>
                <CodeBlock label="Linux (apt)">sudo apt install gh</CodeBlock>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Then authenticate:{' '}
                <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                  gh auth login
                </code>
              </p>
            </>
          ) : isNotAuthenticated ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Authenticate with GitHub
              </p>
              <CodeBlock label="Run in terminal">gh auth login</CodeBlock>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Follow the prompts to authenticate with your GitHub account.
              </p>
            </>
          ) : null}
        </div>

        {/* Error message */}
        {status.error && (
          <p className="mb-4 text-xs text-red-500 dark:text-red-400">{status.error}</p>
        )}

        {/* Retry button */}
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Check Again
        </button>
      </div>
    </div>
  );
};

/**
 * Code block helper for displaying terminal commands
 */
const CodeBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-[10px] text-gray-400 dark:text-gray-500">{label}</span>
    <code className="mt-0.5 block rounded bg-gray-200 px-3 py-1.5 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      {children}
    </code>
  </div>
);

GitHubSetupPrompt.displayName = 'GitHubSetupPrompt';
