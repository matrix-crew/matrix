import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@maxtix/ui';
import type {
  PipelineNode as PipelineNodeType,
  PipelineNodeType as NodeType,
} from '@/types/pipeline';

/**
 * Node type color variants
 */
const nodeVariants = cva(
  'relative flex w-64 flex-col rounded-lg border-2 bg-white shadow-md transition-all dark:bg-gray-800',
  {
    variants: {
      nodeType: {
        trigger: 'border-purple-400 dark:border-purple-600',
        action: 'border-blue-400 dark:border-blue-600',
        transform: 'border-amber-400 dark:border-amber-600',
        output: 'border-green-400 dark:border-green-600',
      },
      selected: {
        true: 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
        false: '',
      },
      status: {
        idle: '',
        running: 'animate-pulse',
        completed: '',
        error: 'border-red-500 dark:border-red-600',
      },
    },
    defaultVariants: {
      nodeType: 'action',
      selected: false,
      status: 'idle',
    },
  }
);

/**
 * Node header color variants based on type
 */
const nodeHeaderVariants = cva('flex items-center gap-2 rounded-t-md px-3 py-2', {
  variants: {
    nodeType: {
      trigger: 'bg-purple-100 dark:bg-purple-900/50',
      action: 'bg-blue-100 dark:bg-blue-900/50',
      transform: 'bg-amber-100 dark:bg-amber-900/50',
      output: 'bg-green-100 dark:bg-green-900/50',
    },
  },
  defaultVariants: {
    nodeType: 'action',
  },
});

/**
 * Status indicator variants
 */
const statusIndicatorVariants = cva('h-2 w-2 rounded-full', {
  variants: {
    status: {
      idle: 'bg-gray-400',
      running: 'bg-yellow-500 animate-pulse',
      completed: 'bg-green-500',
      error: 'bg-red-500',
    },
  },
  defaultVariants: {
    status: 'idle',
  },
});

/**
 * Port variants for input/output connection points
 */
const portVariants = cva(
  'flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-all hover:scale-125 dark:bg-gray-800',
  {
    variants: {
      type: {
        input: 'border-gray-400 hover:border-blue-500 dark:border-gray-600',
        output: 'border-gray-400 hover:border-green-500 dark:border-gray-600',
      },
      connected: {
        true: 'bg-blue-500 border-blue-500',
        false: '',
      },
    },
    defaultVariants: {
      type: 'input',
      connected: false,
    },
  }
);

export interface PipelineNodeProps extends VariantProps<typeof nodeVariants> {
  /** The node data to display */
  node: PipelineNodeType;
  /** Whether this node is currently selected */
  isSelected?: boolean;
  /** Callback when the node is clicked */
  onClick?: (node: PipelineNodeType) => void;
  /** Callback when drag starts */
  onDragStart?: (node: PipelineNodeType, event: React.MouseEvent) => void;
  /** Callback when drag ends */
  onDragEnd?: () => void;
  /** Callback when a port is clicked (for creating connections) */
  onPortClick?: (nodeId: string, portId: string, portType: 'input' | 'output') => void;
  /** Set of connected port IDs for this node */
  connectedPorts?: Set<string>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the icon SVG for a node type
 */
function getNodeIcon(nodeType: NodeType): React.ReactNode {
  switch (nodeType) {
    case 'trigger':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'action':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case 'transform':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    case 'output':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      );
  }
}

/**
 * PipelineNode component
 *
 * Displays a single node in the pipeline editor. Nodes represent steps in a
 * sequential automation workflow. Supports drag-and-drop repositioning and
 * port connections for linking nodes together.
 *
 * @example
 * <PipelineNode
 *   node={{ id: '1', type: 'action', title: 'Web Scraper', ... }}
 *   isSelected={selectedNodeId === '1'}
 *   onClick={(node) => selectNode(node)}
 *   onPortClick={(nodeId, portId, type) => startConnection(nodeId, portId, type)}
 * />
 */
const PipelineNode: React.FC<PipelineNodeProps> = ({
  node,
  isSelected = false,
  onClick,
  onDragStart,
  onDragEnd,
  onPortClick,
  connectedPorts = new Set(),
  className,
}) => {
  /**
   * Handle node click
   */
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick?.(node);
  };

  /**
   * Handle mouse down for drag start
   */
  const handleMouseDown = (event: React.MouseEvent) => {
    // Only start drag on left click and when clicking the node body (not ports)
    if (event.button === 0 && event.target === event.currentTarget) {
      onDragStart?.(node, event);
    }
  };

  /**
   * Handle mouse up for drag end
   */
  const handleMouseUp = () => {
    onDragEnd?.();
  };

  /**
   * Handle port click for creating connections
   */
  const handlePortClick =
    (portId: string, portType: 'input' | 'output') => (event: React.MouseEvent) => {
      event.stopPropagation();
      onPortClick?.(node.id, portId, portType);
    };

  return (
    <div
      className={cn(
        nodeVariants({
          nodeType: node.type,
          selected: isSelected,
          status: node.status,
        }),
        className
      )}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        cursor: 'grab',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      role="button"
      aria-label={`Pipeline node: ${node.title}`}
      aria-selected={isSelected}
      tabIndex={0}
    >
      {/* Node header */}
      <div className={nodeHeaderVariants({ nodeType: node.type })}>
        <div className="text-gray-700 dark:text-gray-300">{getNodeIcon(node.type)}</div>
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
          {node.title}
        </span>
        <div className={statusIndicatorVariants({ status: node.status })} title={node.status} />
      </div>

      {/* Node body */}
      <div className="p-3">
        {node.description && (
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{node.description}</p>
        )}

        {/* Input ports */}
        {node.inputs.length > 0 && (
          <div className="mb-2 space-y-1">
            {node.inputs.map((port) => (
              <div key={port.id} className="flex items-center gap-2">
                <button
                  type="button"
                  className={portVariants({
                    type: 'input',
                    connected: connectedPorts.has(`input:${port.id}`),
                  })}
                  onClick={handlePortClick(port.id, 'input')}
                  style={{ marginLeft: '-20px' }}
                  title={`Input: ${port.label} (${port.dataType})`}
                  aria-label={`Connect to input ${port.label}`}
                >
                  <span className="sr-only">{port.label}</span>
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">{port.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output ports */}
        {node.outputs.length > 0 && (
          <div className="space-y-1">
            {node.outputs.map((port) => (
              <div key={port.id} className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{port.label}</span>
                <button
                  type="button"
                  className={portVariants({
                    type: 'output',
                    connected: connectedPorts.has(`output:${port.id}`),
                  })}
                  onClick={handlePortClick(port.id, 'output')}
                  style={{ marginRight: '-20px' }}
                  title={`Output: ${port.label} (${port.dataType})`}
                  aria-label={`Connect from output ${port.label}`}
                >
                  <span className="sr-only">{port.label}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order badge */}
      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white dark:bg-gray-200 dark:text-gray-800">
        {node.order + 1}
      </div>
    </div>
  );
};

PipelineNode.displayName = 'PipelineNode';

export { PipelineNode, nodeVariants, nodeHeaderVariants, statusIndicatorVariants, portVariants };
