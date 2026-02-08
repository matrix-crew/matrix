import * as React from 'react';
import { cn } from '@maxtix/ui';
import { PipelineNode } from './PipelineNode';
import {
  type Pipeline,
  type PipelineEditorState,
  type PipelineNode as PipelineNodeType,
  type PipelineConnection,
  createSamplePipeline,
  createInitialEditorState,
  createPipelineConnection,
} from '@/types/pipeline';

export interface PipelineEditorProps {
  /** Initial pipeline to edit - if not provided, creates sample pipeline */
  initialPipeline?: Pipeline;
  /** Callback when pipeline changes */
  onPipelineChange?: (pipeline: Pipeline) => void;
  /** Callback when a node is selected */
  onNodeSelect?: (node: PipelineNodeType | null) => void;
  /** Additional CSS classes for the editor container */
  className?: string;
}

/**
 * Calculate the connection path between two nodes
 */
function calculateConnectionPath(
  sourceNode: PipelineNodeType,
  targetNode: PipelineNodeType
): string {
  const sourceX = sourceNode.x + 256; // Node width
  const sourceY = sourceNode.y + 60; // Approximate port position
  const targetX = targetNode.x;
  const targetY = targetNode.y + 60;

  // Create a smooth bezier curve
  const controlPointOffset = Math.abs(targetX - sourceX) / 2;

  return `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;
}

/**
 * PipelineEditor component
 *
 * Main Pipeline editor component that provides a visual node-based workflow design.
 * Supports dragging nodes, creating connections, and visualizing sequential automation.
 * Pipelines represent linear task chains for recurring operations like:
 * 9 AM scraping → summarization → blog posting
 *
 * @example
 * <PipelineEditor
 *   onPipelineChange={(pipeline) => savePipeline(pipeline)}
 *   onNodeSelect={(node) => showNodeSettings(node)}
 * />
 */
const PipelineEditor: React.FC<PipelineEditorProps> = ({
  initialPipeline,
  onPipelineChange,
  onNodeSelect,
  className,
}) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [editorState, setEditorState] = React.useState<PipelineEditorState>(() => {
    if (initialPipeline) {
      return {
        ...createInitialEditorState(),
        pipeline: initialPipeline,
      };
    }
    // Create sample pipeline for demonstration
    return {
      ...createInitialEditorState(),
      pipeline: createSamplePipeline(),
    };
  });

  // Track connecting state for drawing connections
  const [connectingFrom, setConnectingFrom] = React.useState<{
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
  } | null>(null);

  // Track drag state
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = React.useState<string | null>(null);

  /**
   * Update editor state and notify parent
   */
  const updateEditorState = React.useCallback(
    (newState: PipelineEditorState) => {
      setEditorState(newState);
      onPipelineChange?.(newState.pipeline);
    },
    [onPipelineChange]
  );

  /**
   * Handle node selection
   */
  const handleNodeClick = React.useCallback(
    (node: PipelineNodeType) => {
      updateEditorState({
        ...editorState,
        selectedNodeId: editorState.selectedNodeId === node.id ? undefined : node.id,
      });
      onNodeSelect?.(editorState.selectedNodeId === node.id ? null : node);
    },
    [editorState, onNodeSelect, updateEditorState]
  );

  /**
   * Handle canvas click to deselect
   */
  const handleCanvasClick = React.useCallback(() => {
    if (editorState.selectedNodeId) {
      updateEditorState({
        ...editorState,
        selectedNodeId: undefined,
      });
      onNodeSelect?.(null);
    }
    setConnectingFrom(null);
  }, [editorState, onNodeSelect, updateEditorState]);

  /**
   * Handle node drag start
   */
  const handleNodeDragStart = React.useCallback(
    (node: PipelineNodeType, event: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      setDraggingNodeId(node.id);
      setDragOffset({
        x: event.clientX - canvasRect.left - node.x,
        y: event.clientY - canvasRect.top - node.y,
      });

      updateEditorState({
        ...editorState,
        isDraggingNode: true,
      });
    },
    [editorState, updateEditorState]
  );

  /**
   * Handle node drag end
   */
  const handleNodeDragEnd = React.useCallback(() => {
    setDraggingNodeId(null);
    setDragOffset(null);
    updateEditorState({
      ...editorState,
      isDraggingNode: false,
    });
  }, [editorState, updateEditorState]);

  /**
   * Handle mouse move for dragging
   */
  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent) => {
      if (!draggingNodeId || !dragOffset || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, event.clientX - canvasRect.left - dragOffset.x);
      const newY = Math.max(0, event.clientY - canvasRect.top - dragOffset.y);

      const updatedNodes = editorState.pipeline.nodes.map((node) =>
        node.id === draggingNodeId ? { ...node, x: newX, y: newY, updatedAt: new Date() } : node
      );

      updateEditorState({
        ...editorState,
        pipeline: {
          ...editorState.pipeline,
          nodes: updatedNodes,
          updatedAt: new Date(),
        },
      });
    },
    [draggingNodeId, dragOffset, editorState, updateEditorState]
  );

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = React.useCallback(() => {
    if (draggingNodeId) {
      handleNodeDragEnd();
    }
  }, [draggingNodeId, handleNodeDragEnd]);

  /**
   * Handle port click for creating connections
   */
  const handlePortClick = React.useCallback(
    (nodeId: string, portId: string, portType: 'input' | 'output') => {
      if (!connectingFrom) {
        // Start connecting
        setConnectingFrom({ nodeId, portId, portType });
      } else {
        // Complete connection
        if (connectingFrom.nodeId !== nodeId && connectingFrom.portType !== portType) {
          // Create new connection
          const sourceNodeId =
            connectingFrom.portType === 'output' ? connectingFrom.nodeId : nodeId;
          const sourcePortId =
            connectingFrom.portType === 'output' ? connectingFrom.portId : portId;
          const targetNodeId = connectingFrom.portType === 'input' ? connectingFrom.nodeId : nodeId;
          const targetPortId = connectingFrom.portType === 'input' ? connectingFrom.portId : portId;

          // Check if connection already exists
          const connectionExists = editorState.pipeline.connections.some(
            (conn) =>
              conn.sourceNodeId === sourceNodeId &&
              conn.targetNodeId === targetNodeId &&
              conn.sourcePortId === sourcePortId &&
              conn.targetPortId === targetPortId
          );

          if (!connectionExists) {
            const newConnection = createPipelineConnection(
              sourceNodeId,
              sourcePortId,
              targetNodeId,
              targetPortId
            );

            updateEditorState({
              ...editorState,
              pipeline: {
                ...editorState.pipeline,
                connections: [...editorState.pipeline.connections, newConnection],
                updatedAt: new Date(),
              },
            });
          }
        }
        setConnectingFrom(null);
      }
    },
    [connectingFrom, editorState, updateEditorState]
  );

  /**
   * Get connected ports for a node
   */
  const getConnectedPorts = React.useCallback(
    (nodeId: string): Set<string> => {
      const connected = new Set<string>();
      editorState.pipeline.connections.forEach((conn) => {
        if (conn.sourceNodeId === nodeId) {
          connected.add(`output:${conn.sourcePortId}`);
        }
        if (conn.targetNodeId === nodeId) {
          connected.add(`input:${conn.targetPortId}`);
        }
      });
      return connected;
    },
    [editorState.pipeline.connections]
  );

  /**
   * Render connection lines
   */
  const renderConnections = React.useCallback(() => {
    return editorState.pipeline.connections.map((connection: PipelineConnection) => {
      const sourceNode = editorState.pipeline.nodes.find((n) => n.id === connection.sourceNodeId);
      const targetNode = editorState.pipeline.nodes.find((n) => n.id === connection.targetNodeId);

      if (!sourceNode || !targetNode) return null;

      const path = calculateConnectionPath(sourceNode, targetNode);

      return (
        <path
          key={connection.id}
          d={path}
          fill="none"
          stroke="url(#connectionGradient)"
          strokeWidth={2}
          className="transition-all"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  }, [editorState.pipeline.connections, editorState.pipeline.nodes]);

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Editor header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editorState.pipeline.name}
          </h2>
          {editorState.pipeline.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {editorState.pipeline.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
              editorState.pipeline.status === 'active' &&
                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              editorState.pipeline.status === 'draft' &&
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
              editorState.pipeline.status === 'running' &&
                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              editorState.pipeline.status === 'paused' &&
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              editorState.pipeline.status === 'error' &&
                'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            )}
          >
            {editorState.pipeline.status.charAt(0).toUpperCase() +
              editorState.pipeline.status.slice(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {editorState.pipeline.nodes.length} nodes
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label="Pipeline editor canvas"
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Connection SVG layer */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Arrow marker for connections */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-blue-500" />
            </marker>
            {/* Gradient for connection lines */}
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          {renderConnections()}
        </svg>

        {/* Nodes layer */}
        <div className="relative min-h-full min-w-full" style={{ minHeight: '500px' }}>
          {editorState.pipeline.nodes
            .sort((a, b) => a.order - b.order)
            .map((node) => (
              <PipelineNode
                key={node.id}
                node={node}
                isSelected={editorState.selectedNodeId === node.id}
                onClick={handleNodeClick}
                onDragStart={handleNodeDragStart}
                onDragEnd={handleNodeDragEnd}
                onPortClick={handlePortClick}
                connectedPorts={getConnectedPorts(node.id)}
              />
            ))}
        </div>

        {/* Connecting indicator */}
        {connectingFrom && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded bg-blue-500 px-2 py-1 text-xs text-white">
            Click another port to complete connection
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-purple-400" />
          <span>Trigger</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-blue-400" />
          <span>Action</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-amber-400" />
          <span>Transform</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-green-400" />
          <span>Output</span>
        </div>
      </div>
    </div>
  );
};

PipelineEditor.displayName = 'PipelineEditor';

export { PipelineEditor };
