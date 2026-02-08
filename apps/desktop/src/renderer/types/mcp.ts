/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Type definitions for the MCP visual control interface in the Agent tab.
 * Provides GUI layer for MCP operations and visual control panel.
 */

/**
 * MCP Server connection status
 */
export type MCPConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/**
 * MCP Tool parameter type
 */
export type MCPParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * MCP Tool parameter definition
 */
export interface MCPToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: MCPParameterType;
  /** Description of the parameter */
  description?: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value for the parameter */
  defaultValue?: unknown;
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  /** Unique identifier for the tool */
  id: string;
  /** Display name for the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Parameters accepted by the tool */
  parameters: MCPToolParameter[];
  /** Category for grouping tools */
  category?: string;
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  /** Unique identifier for the resource */
  id: string;
  /** URI of the resource */
  uri: string;
  /** Display name for the resource */
  name: string;
  /** Description of the resource */
  description?: string;
  /** MIME type of the resource */
  mimeType?: string;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt {
  /** Unique identifier for the prompt */
  id: string;
  /** Display name for the prompt */
  name: string;
  /** Description of the prompt */
  description?: string;
  /** Arguments accepted by the prompt */
  arguments?: MCPToolParameter[];
}

/**
 * MCP Server configuration
 */
export interface MCPServer {
  /** Unique identifier for the server */
  id: string;
  /** Display name for the server */
  name: string;
  /** Server transport type */
  transport: 'stdio' | 'http' | 'websocket';
  /** Connection status */
  status: MCPConnectionStatus;
  /** Server endpoint (command for stdio, URL for http/websocket) */
  endpoint: string;
  /** Available tools on this server */
  tools: MCPTool[];
  /** Available resources on this server */
  resources: MCPResource[];
  /** Available prompts on this server */
  prompts: MCPPrompt[];
  /** Last connection time */
  connectedAt?: Date;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * MCP Tool invocation
 */
export interface MCPToolInvocation {
  /** Unique identifier for the invocation */
  id: string;
  /** ID of the tool being invoked */
  toolId: string;
  /** Name of the tool */
  toolName: string;
  /** ID of the server */
  serverId: string;
  /** Input parameters */
  input: Record<string, unknown>;
  /** Output result (if completed) */
  output?: unknown;
  /** Invocation status */
  status: 'pending' | 'running' | 'completed' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Start timestamp */
  startedAt: Date;
  /** End timestamp */
  completedAt?: Date;
}

/**
 * MCP Control panel state
 */
export interface MCPControlState {
  /** All connected servers */
  servers: MCPServer[];
  /** Currently selected server ID */
  selectedServerId: string | null;
  /** Currently selected tool ID */
  selectedToolId: string | null;
  /** Tool invocation history */
  invocationHistory: MCPToolInvocation[];
  /** Whether the panel is expanded */
  isExpanded: boolean;
}

/**
 * Create a new MCP server configuration
 *
 * @param name - Display name for the server
 * @param transport - Transport type
 * @param endpoint - Server endpoint
 * @returns A new MCPServer object
 */
export function createMCPServer(
  name: string,
  transport: MCPServer['transport'],
  endpoint: string
): MCPServer {
  return {
    id: crypto.randomUUID(),
    name,
    transport,
    endpoint,
    status: 'disconnected',
    tools: [],
    resources: [],
    prompts: [],
  };
}

/**
 * Create a new MCP tool invocation
 *
 * @param toolId - ID of the tool
 * @param toolName - Name of the tool
 * @param serverId - ID of the server
 * @param input - Input parameters
 * @returns A new MCPToolInvocation object
 */
export function createMCPToolInvocation(
  toolId: string,
  toolName: string,
  serverId: string,
  input: Record<string, unknown>
): MCPToolInvocation {
  return {
    id: crypto.randomUUID(),
    toolId,
    toolName,
    serverId,
    input,
    status: 'pending',
    startedAt: new Date(),
  };
}

/**
 * Create initial MCP control state
 *
 * @returns Initial MCPControlState with sample data
 */
export function createInitialMCPState(): MCPControlState {
  // Sample MCP servers for demonstration
  const sampleServers: MCPServer[] = [
    {
      id: 'server-filesystem',
      name: 'Filesystem',
      transport: 'stdio',
      endpoint: '@modelcontextprotocol/server-filesystem',
      status: 'connected',
      connectedAt: new Date(),
      tools: [
        {
          id: 'tool-read-file',
          name: 'read_file',
          description: 'Read the complete contents of a file from the file system',
          category: 'File Operations',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Path to the file to read',
              required: true,
            },
          ],
        },
        {
          id: 'tool-write-file',
          name: 'write_file',
          description: 'Create a new file or completely overwrite an existing file',
          category: 'File Operations',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Path to the file to write',
              required: true,
            },
            {
              name: 'content',
              type: 'string',
              description: 'Content to write to the file',
              required: true,
            },
          ],
        },
        {
          id: 'tool-list-dir',
          name: 'list_directory',
          description: 'Get a detailed listing of files and directories in a specified path',
          category: 'File Operations',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Path to the directory to list',
              required: true,
            },
          ],
        },
      ],
      resources: [
        {
          id: 'res-cwd',
          uri: 'file://.',
          name: 'Current Directory',
          description: 'The current working directory',
        },
      ],
      prompts: [],
    },
    {
      id: 'server-github',
      name: 'GitHub',
      transport: 'stdio',
      endpoint: '@modelcontextprotocol/server-github',
      status: 'connected',
      connectedAt: new Date(),
      tools: [
        {
          id: 'tool-create-issue',
          name: 'create_issue',
          description: 'Create a new issue in a GitHub repository',
          category: 'Issues',
          parameters: [
            {
              name: 'owner',
              type: 'string',
              description: 'Repository owner',
              required: true,
            },
            {
              name: 'repo',
              type: 'string',
              description: 'Repository name',
              required: true,
            },
            {
              name: 'title',
              type: 'string',
              description: 'Issue title',
              required: true,
            },
            {
              name: 'body',
              type: 'string',
              description: 'Issue body',
              required: false,
            },
          ],
        },
        {
          id: 'tool-search-repos',
          name: 'search_repositories',
          description: 'Search for GitHub repositories',
          category: 'Search',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Search query',
              required: true,
            },
          ],
        },
      ],
      resources: [],
      prompts: [
        {
          id: 'prompt-pr-review',
          name: 'PR Review',
          description: 'Review a pull request and provide feedback',
          arguments: [
            {
              name: 'pr_url',
              type: 'string',
              description: 'URL of the pull request to review',
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: 'server-custom',
      name: 'Custom Server',
      transport: 'websocket',
      endpoint: 'ws://localhost:8080/mcp',
      status: 'disconnected',
      tools: [],
      resources: [],
      prompts: [],
    },
  ];

  return {
    servers: sampleServers,
    selectedServerId: sampleServers[0].id,
    selectedToolId: null,
    invocationHistory: [],
    isExpanded: true,
  };
}

/**
 * Get tools grouped by category
 *
 * @param tools - Array of MCP tools
 * @returns Tools grouped by category
 */
export function groupToolsByCategory(tools: MCPTool[]): Record<string, MCPTool[]> {
  return tools.reduce(
    (acc, tool) => {
      const category = tool.category ?? 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    },
    {} as Record<string, MCPTool[]>
  );
}

/**
 * Get status color class for connection status
 *
 * @param status - MCP connection status
 * @returns Tailwind CSS color class
 */
export function getStatusColorClass(status: MCPConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'text-green-500';
    case 'connecting':
      return 'text-yellow-500';
    case 'disconnected':
      return 'text-gray-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get status background color class for connection status
 *
 * @param status - MCP connection status
 * @returns Tailwind CSS background color class
 */
export function getStatusBgClass(status: MCPConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500';
    case 'disconnected':
      return 'bg-gray-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}
