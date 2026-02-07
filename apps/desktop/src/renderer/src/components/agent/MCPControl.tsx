import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import {
  type MCPControlState,
  type MCPServer,
  type MCPTool,
  type MCPToolInvocation,
  createInitialMCPState,
  createMCPToolInvocation,
  groupToolsByCategory,
  getStatusBgClass,
} from '@/types/mcp';

/**
 * Server list item variants using class-variance-authority
 */
const serverItemVariants = cva(
  'flex items-center gap-3 rounded-lg p-3 transition-all cursor-pointer',
  {
    variants: {
      selected: {
        true: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        false: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Tool card variants using class-variance-authority
 */
const toolCardVariants = cva(
  'rounded-lg border p-3 transition-all cursor-pointer',
  {
    variants: {
      selected: {
        true: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
        false: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface MCPControlProps extends VariantProps<typeof serverItemVariants> {
  /** Initial state for the MCP control panel */
  initialState?: MCPControlState;
  /** Callback when state changes */
  onStateChange?: (state: MCPControlState) => void;
  /** Additional CSS classes for the control container */
  className?: string;
}

/**
 * MCPControl component
 *
 * Visual MCP (Model Context Protocol) control interface that provides a GUI layer
 * for MCP operations. Displays connected servers, available tools, resources,
 * and prompts, and allows users to invoke tools with visual parameter input.
 *
 * @example
 * <MCPControl
 *   onStateChange={(state) => saveToBackend(state)}
 * />
 */
const MCPControl: React.FC<MCPControlProps> = ({
  initialState,
  onStateChange,
  className,
}) => {
  const [state, setState] = React.useState<MCPControlState>(() => {
    return initialState ?? createInitialMCPState();
  });

  /**
   * Update state and notify parent
   */
  const updateState = React.useCallback(
    (newState: MCPControlState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  /**
   * Handle server selection
   */
  const handleSelectServer = React.useCallback(
    (serverId: string) => {
      updateState({
        ...state,
        selectedServerId: serverId,
        selectedToolId: null,
      });
    },
    [state, updateState]
  );

  /**
   * Handle tool selection
   */
  const handleSelectTool = React.useCallback(
    (toolId: string) => {
      updateState({
        ...state,
        selectedToolId: state.selectedToolId === toolId ? null : toolId,
      });
    },
    [state, updateState]
  );

  /**
   * Handle tool invocation
   */
  const handleInvokeTool = React.useCallback(
    (tool: MCPTool, serverId: string, input: Record<string, unknown>) => {
      const invocation = createMCPToolInvocation(tool.id, tool.name, serverId, input);

      // Simulate tool execution
      const completedInvocation: MCPToolInvocation = {
        ...invocation,
        status: 'completed',
        completedAt: new Date(),
        output: { message: `Tool "${tool.name}" executed successfully`, input },
      };

      updateState({
        ...state,
        invocationHistory: [completedInvocation, ...state.invocationHistory],
        selectedToolId: null,
      });
    },
    [state, updateState]
  );

  /**
   * Get the currently selected server
   */
  const selectedServer = React.useMemo(() => {
    return state.servers.find((s) => s.id === state.selectedServerId);
  }, [state.servers, state.selectedServerId]);

  /**
   * Get the currently selected tool
   */
  const selectedTool = React.useMemo(() => {
    if (!selectedServer || !state.selectedToolId) return null;
    return selectedServer.tools.find((t) => t.id === state.selectedToolId);
  }, [selectedServer, state.selectedToolId]);

  /**
   * Get tools grouped by category for the selected server
   */
  const groupedTools = React.useMemo(() => {
    if (!selectedServer) return {};
    return groupToolsByCategory(selectedServer.tools);
  }, [selectedServer]);

  return (
    <div
      className={cn('flex h-full gap-4 overflow-hidden', className)}
      role="region"
      aria-label="MCP Control Panel"
    >
      {/* Left panel - Server list */}
      <div className="flex w-64 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            MCP Servers
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {state.servers.filter((s) => s.status === 'connected').length} connected
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {state.servers.map((server) => (
              <ServerListItem
                key={server.id}
                server={server}
                selected={server.id === state.selectedServerId}
                onClick={() => handleSelectServer(server.id)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            aria-label="Add new server"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
            Add Server
          </button>
        </div>
      </div>

      {/* Center panel - Tools and Resources */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {selectedServer ? (
          <>
            {/* Server header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedServer.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedServer.endpoint}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    selectedServer.status === 'connected'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedServer.status === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', getStatusBgClass(selectedServer.status))} />
                  {selectedServer.status.charAt(0).toUpperCase() + selectedServer.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Tools section */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Tools */}
                {selectedServer.tools.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Tools ({selectedServer.tools.length})
                    </h3>
                    {Object.entries(groupedTools).map(([category, tools]) => (
                      <div key={category} className="mb-4">
                        <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {category}
                        </h4>
                        <div className="grid gap-2">
                          {tools.map((tool) => (
                            <ToolCard
                              key={tool.id}
                              tool={tool}
                              selected={tool.id === state.selectedToolId}
                              onClick={() => handleSelectTool(tool.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resources */}
                {selectedServer.resources.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Resources ({selectedServer.resources.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedServer.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-850"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className="h-4 w-4 text-gray-500"
                            >
                              <path d="M3.75 3a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75V6.707a.75.75 0 0 0-.22-.53L9.573 2.97a.75.75 0 0 0-.53-.22H3.75Zm2 7.25a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Zm.75-3.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {resource.name}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {resource.uri}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {selectedServer.prompts.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Prompts ({selectedServer.prompts.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedServer.prompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-850"
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className="h-4 w-4 text-purple-500"
                            >
                              <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v1.384l-4.146 2.988a.75.75 0 0 1-.708 0L4.5 5.384V4zm0 3.134V12A1.5 1.5 0 0 0 4 13.5h8A1.5 1.5 0 0 0 13.5 12V7.134l-3.271 2.356a2.25 2.25 0 0 1-2.458 0L4.5 7.134z" />
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {prompt.name}
                            </span>
                          </div>
                          {prompt.description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {prompt.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {selectedServer.tools.length === 0 &&
                  selectedServer.resources.length === 0 &&
                  selectedServer.prompts.length === 0 && (
                    <div className="flex h-48 flex-col items-center justify-center text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 6.75a5.25 5.25 0 0 1 6.775-5.025.75.75 0 0 1 .313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.32a.75.75 0 0 1 1.248.313 5.25 5.25 0 0 1-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 1 1 2.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0 1 12 6.75ZM4.117 19.125a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        No tools, resources, or prompts available
                      </p>
                      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Connect to the server to discover capabilities
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-600"
            >
              <path d="M4.08 5.227A3 3 0 0 1 6.979 3H17.02a3 3 0 0 1 2.9 2.227l2.113 7.926A5.228 5.228 0 0 0 18.75 12H5.25a5.228 5.228 0 0 0-3.284 1.153L4.08 5.227Z" />
              <path
                fillRule="evenodd"
                d="M5.25 13.5a3.75 3.75 0 1 0 0 7.5h13.5a3.75 3.75 0 1 0 0-7.5H5.25Zm10.5 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm3.75-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              Select a server to view its capabilities
            </p>
          </div>
        )}
      </div>

      {/* Right panel - Tool execution */}
      {selectedTool && selectedServer && (
        <ToolExecutionPanel
          tool={selectedTool}
          server={selectedServer}
          onInvoke={(input) => handleInvokeTool(selectedTool, selectedServer.id, input)}
          onClose={() => handleSelectTool(selectedTool.id)}
        />
      )}

      {/* Invocation history panel (when no tool selected) */}
      {!selectedTool && state.invocationHistory.length > 0 && (
        <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recent Invocations
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {state.invocationHistory.slice(0, 10).map((invocation) => (
                <InvocationHistoryItem key={invocation.id} invocation={invocation} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Server list item component
 */
interface ServerListItemProps {
  server: MCPServer;
  selected: boolean;
  onClick: () => void;
}

const ServerListItem: React.FC<ServerListItemProps> = ({ server, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      serverItemVariants({ selected }),
      'w-full border text-left'
    )}
    aria-selected={selected}
    role="option"
  >
    <span className={cn('h-3 w-3 flex-shrink-0 rounded-full', getStatusBgClass(server.status))} />
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {server.name}
      </div>
      <div className="truncate text-xs text-gray-500 dark:text-gray-400">
        {server.tools.length} tools
      </div>
    </div>
  </button>
);

/**
 * Tool card component
 */
interface ToolCardProps {
  tool: MCPTool;
  selected: boolean;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(toolCardVariants({ selected }), 'w-full text-left')}
    aria-selected={selected}
    role="option"
  >
    <div className="flex items-start gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
      >
        <path
          fillRule="evenodd"
          d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.84a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.84.84a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
          clipRule="evenodd"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
          {tool.name}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {tool.description}
        </p>
        {tool.parameters.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tool.parameters.map((param) => (
              <span
                key={param.name}
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-xs',
                  param.required
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                )}
              >
                {param.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </button>
);

/**
 * Tool execution panel component
 */
interface ToolExecutionPanelProps {
  tool: MCPTool;
  server: MCPServer;
  onInvoke: (input: Record<string, unknown>) => void;
  onClose: () => void;
}

const ToolExecutionPanel: React.FC<ToolExecutionPanelProps> = ({
  tool,
  server,
  onInvoke,
  onClose,
}) => {
  const [params, setParams] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    tool.parameters.forEach((param) => {
      initial[param.name] = param.defaultValue?.toString() ?? '';
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: Record<string, unknown> = {};
    tool.parameters.forEach((param) => {
      const value = params[param.name];
      if (value) {
        switch (param.type) {
          case 'number':
            input[param.name] = Number(value);
            break;
          case 'boolean':
            input[param.name] = value === 'true';
            break;
          default:
            input[param.name] = value;
        }
      }
    });
    onInvoke(input);
  };

  return (
    <div className="flex w-80 flex-shrink-0 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div>
          <h3 className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
            {tool.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{server.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close tool panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>

          {tool.parameters.length > 0 ? (
            <div className="space-y-4">
              {tool.parameters.map((param) => (
                <div key={param.name}>
                  <label
                    htmlFor={`param-${param.name}`}
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {param.name}
                    {param.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  <input
                    id={`param-${param.name}`}
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={params[param.name]}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    placeholder={param.description}
                    required={param.required}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  {param.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This tool has no parameters.
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Invoke Tool
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Invocation history item component
 */
interface InvocationHistoryItemProps {
  invocation: MCPToolInvocation;
}

const InvocationHistoryItem: React.FC<InvocationHistoryItemProps> = ({ invocation }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-850">
    <div className="flex items-center justify-between">
      <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
        {invocation.toolName}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
          invocation.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : invocation.status === 'error'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        )}
      >
        {invocation.status}
      </span>
    </div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {invocation.startedAt.toLocaleTimeString()}
    </p>
  </div>
);

MCPControl.displayName = 'MCPControl';

export { MCPControl, serverItemVariants, toolCardVariants };
