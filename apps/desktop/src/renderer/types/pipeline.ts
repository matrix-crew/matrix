/**
 * Pipeline Type Definitions
 *
 * Type definitions for the Pipeline visual workflow editor feature.
 * Supports sequential automation workflows with visual node-based design.
 * Pipelines represent linear task chains for recurring operations.
 */

/**
 * Types of nodes available in the pipeline
 */
export type PipelineNodeType = 'trigger' | 'action' | 'transform' | 'output';

/**
 * Status of a pipeline node during execution
 */
export type PipelineNodeStatus = 'idle' | 'running' | 'completed' | 'error';

/**
 * Status of the entire pipeline
 */
export type PipelineStatus = 'draft' | 'active' | 'paused' | 'running' | 'completed' | 'error';

/**
 * Trigger types for starting a pipeline
 */
export type PipelineTriggerType = 'schedule' | 'manual' | 'webhook' | 'event';

/**
 * Configuration for a node port (input/output connection point)
 */
export interface PipelineNodePort {
  /** Unique identifier for the port */
  id: string;
  /** Display label for the port */
  label: string;
  /** Data type this port accepts/outputs */
  dataType: 'any' | 'text' | 'json' | 'array' | 'boolean' | 'number';
}

/**
 * Represents a single node in the pipeline
 */
export interface PipelineNode {
  /** Unique identifier for the node */
  id: string;
  /** Type of the node (trigger, action, transform, output) */
  type: PipelineNodeType;
  /** Display title for the node */
  title: string;
  /** Optional description of what this node does */
  description?: string;
  /** Input ports for receiving data from previous nodes */
  inputs: PipelineNodePort[];
  /** Output ports for sending data to next nodes */
  outputs: PipelineNodePort[];
  /** X position on the canvas */
  x: number;
  /** Y position on the canvas */
  y: number;
  /** Node-specific configuration */
  config?: Record<string, unknown>;
  /** Current execution status */
  status: PipelineNodeStatus;
  /** Order in the linear pipeline sequence */
  order: number;
}

/**
 * Represents a connection between two nodes
 */
export interface PipelineConnection {
  /** Unique identifier for the connection */
  id: string;
  /** Source node ID */
  sourceNodeId: string;
  /** Source port ID */
  sourcePortId: string;
  /** Target node ID */
  targetNodeId: string;
  /** Target port ID */
  targetPortId: string;
}

/**
 * Schedule configuration for scheduled triggers
 */
export interface PipelineSchedule {
  /** Cron expression or simple time (e.g., "09:00") */
  expression: string;
  /** Timezone for the schedule */
  timezone: string;
  /** Whether the schedule is enabled */
  enabled: boolean;
}

/**
 * Represents a complete pipeline definition
 */
export interface Pipeline {
  /** Unique identifier for the pipeline */
  id: string;
  /** Display name of the pipeline */
  name: string;
  /** Optional description of what this pipeline does */
  description?: string;
  /** Nodes in the pipeline */
  nodes: PipelineNode[];
  /** Connections between nodes */
  connections: PipelineConnection[];
  /** Trigger type for starting the pipeline */
  triggerType: PipelineTriggerType;
  /** Schedule configuration (if trigger type is 'schedule') */
  schedule?: PipelineSchedule;
  /** Current pipeline status */
  status: PipelineStatus;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Last execution timestamp */
  lastRunAt?: Date;
}

/**
 * State for the pipeline editor
 */
export interface PipelineEditorState {
  /** The pipeline being edited */
  pipeline: Pipeline;
  /** Currently selected node ID */
  selectedNodeId?: string;
  /** Whether user is currently dragging a node */
  isDraggingNode: boolean;
  /** Whether user is currently creating a connection */
  isConnecting: boolean;
  /** Zoom level of the canvas (1 = 100%) */
  zoom: number;
  /** Canvas pan offset X */
  panX: number;
  /** Canvas pan offset Y */
  panY: number;
}

/**
 * Node template for creating new nodes
 */
export interface PipelineNodeTemplate {
  /** Type of node this template creates */
  type: PipelineNodeType;
  /** Display title for the node */
  title: string;
  /** Description of what this node type does */
  description: string;
  /** Default input ports */
  defaultInputs: PipelineNodePort[];
  /** Default output ports */
  defaultOutputs: PipelineNodePort[];
  /** Icon name or component for the node */
  icon: string;
}

/**
 * Default node templates available for creating new nodes
 */
export const DEFAULT_NODE_TEMPLATES: PipelineNodeTemplate[] = [
  {
    type: 'trigger',
    title: 'Schedule Trigger',
    description: 'Start pipeline at scheduled times',
    defaultInputs: [],
    defaultOutputs: [{ id: 'output', label: 'Output', dataType: 'any' }],
    icon: 'clock',
  },
  {
    type: 'action',
    title: 'Web Scraper',
    description: 'Fetch and extract data from web pages',
    defaultInputs: [{ id: 'url', label: 'URL', dataType: 'text' }],
    defaultOutputs: [{ id: 'data', label: 'Data', dataType: 'text' }],
    icon: 'globe',
  },
  {
    type: 'transform',
    title: 'LLM Summarize',
    description: 'Summarize text using AI',
    defaultInputs: [{ id: 'input', label: 'Input', dataType: 'text' }],
    defaultOutputs: [{ id: 'summary', label: 'Summary', dataType: 'text' }],
    icon: 'sparkles',
  },
  {
    type: 'output',
    title: 'Blog Publisher',
    description: 'Publish content to a blog platform',
    defaultInputs: [{ id: 'content', label: 'Content', dataType: 'text' }],
    defaultOutputs: [],
    icon: 'send',
  },
];

/**
 * Create a new pipeline node with default values
 *
 * @param template - The template to create the node from
 * @param position - The position on the canvas
 * @param order - The order in the pipeline sequence
 * @returns A new PipelineNode object
 */
export function createPipelineNode(
  template: PipelineNodeTemplate,
  position: { x: number; y: number },
  order: number
): PipelineNode {
  return {
    id: crypto.randomUUID(),
    type: template.type,
    title: template.title,
    description: template.description,
    inputs: template.defaultInputs.map((port) => ({ ...port })),
    outputs: template.defaultOutputs.map((port) => ({ ...port })),
    x: position.x,
    y: position.y,
    status: 'idle',
    order,
  };
}

/**
 * Create a new connection between two nodes
 *
 * @param sourceNodeId - The source node ID
 * @param sourcePortId - The source port ID
 * @param targetNodeId - The target node ID
 * @param targetPortId - The target port ID
 * @returns A new PipelineConnection object
 */
export function createPipelineConnection(
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string
): PipelineConnection {
  return {
    id: crypto.randomUUID(),
    sourceNodeId,
    sourcePortId,
    targetNodeId,
    targetPortId,
  };
}

/**
 * Create a new empty pipeline
 *
 * @param name - The name of the pipeline
 * @returns A new Pipeline object
 */
export function createEmptyPipeline(name: string = 'New Pipeline'): Pipeline {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name,
    nodes: [],
    connections: [],
    triggerType: 'manual',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create initial editor state with an empty pipeline
 *
 * @returns Initial PipelineEditorState
 */
export function createInitialEditorState(): PipelineEditorState {
  return {
    pipeline: createEmptyPipeline(),
    isDraggingNode: false,
    isConnecting: false,
    zoom: 1,
    panX: 0,
    panY: 0,
  };
}

/**
 * Create a sample pipeline with demo nodes for demonstration
 *
 * @returns A Pipeline with sample nodes and connections
 */
export function createSamplePipeline(): Pipeline {
  const now = new Date();
  const nodeSpacing = 250;

  // Create sample nodes
  const nodes: PipelineNode[] = [
    {
      id: crypto.randomUUID(),
      type: 'trigger',
      title: 'Schedule Trigger',
      description: 'Run at 9 AM daily',
      inputs: [],
      outputs: [{ id: 'output', label: 'Output', dataType: 'any' }],
      x: 100,
      y: 200,
      status: 'idle',
      order: 0,
      config: { schedule: '0 9 * * *' },
    },
    {
      id: crypto.randomUUID(),
      type: 'action',
      title: 'Web Scraper',
      description: 'Fetch news articles',
      inputs: [{ id: 'trigger', label: 'Trigger', dataType: 'any' }],
      outputs: [{ id: 'data', label: 'Data', dataType: 'text' }],
      x: 100 + nodeSpacing,
      y: 200,
      status: 'idle',
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      type: 'transform',
      title: 'LLM Summarize',
      description: 'Summarize scraped content',
      inputs: [{ id: 'input', label: 'Input', dataType: 'text' }],
      outputs: [{ id: 'summary', label: 'Summary', dataType: 'text' }],
      x: 100 + nodeSpacing * 2,
      y: 200,
      status: 'idle',
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      type: 'output',
      title: 'Blog Publisher',
      description: 'Post to company blog',
      inputs: [{ id: 'content', label: 'Content', dataType: 'text' }],
      outputs: [],
      x: 100 + nodeSpacing * 3,
      y: 200,
      status: 'idle',
      order: 3,
    },
  ];

  // Create connections between nodes
  const connections: PipelineConnection[] = [
    {
      id: crypto.randomUUID(),
      sourceNodeId: nodes[0].id,
      sourcePortId: 'output',
      targetNodeId: nodes[1].id,
      targetPortId: 'trigger',
    },
    {
      id: crypto.randomUUID(),
      sourceNodeId: nodes[1].id,
      sourcePortId: 'data',
      targetNodeId: nodes[2].id,
      targetPortId: 'input',
    },
    {
      id: crypto.randomUUID(),
      sourceNodeId: nodes[2].id,
      sourcePortId: 'summary',
      targetNodeId: nodes[3].id,
      targetPortId: 'content',
    },
  ];

  return {
    id: crypto.randomUUID(),
    name: 'Daily News Blog Post',
    description: '9 AM scraping → summarization → blog posting',
    nodes,
    connections,
    triggerType: 'schedule',
    schedule: {
      expression: '0 9 * * *',
      timezone: 'America/New_York',
      enabled: true,
    },
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}
