"use client";

import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  ConnectionLineType,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";

import { WorkflowDetailDTO } from "@/types/workflows";

const nodeWidth = 172;
const nodeHeight = 36;

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutElements = (
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): { nodes: Node[]; edges: Edge[] } => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const convertStatesToNodes = (workflowDetails: WorkflowDetailDTO): Node[] => {
  return workflowDetails.states.map((state) => {
    const bg = state.isInitial
      ? "var(--initial-node-bg)"
      : state.isFinal
        ? "var(--final-node-bg)"
        : "var(--intermediate-node-bg)";
    const color = state.isInitial
      ? "var(--initial-node-text)"
      : state.isFinal
        ? "var(--final-node-text)"
        : "var(--intermediate-node-text)";
    return {
      id: state.id!.toString(),
      data: { label: state.stateName },
      style: {
        backgroundColor: bg,
        color,
        border: "1px solid var(--node-border-color)",
        borderRadius: "6px",
        padding: "6px 12px",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
      position: { x: 0, y: 0 },
      type: "default",
    };
  });
};

const convertTransitionsToEdges = (
  workflowDetails: WorkflowDetailDTO,
): Edge[] => {
  return workflowDetails.transitions
    .filter(
      (transition) =>
        transition.sourceStateId !== null &&
        transition.targetStateId !== null &&
        workflowDetails.states.some(
          (state) => state.id === transition.sourceStateId,
        ) &&
        workflowDetails.states.some(
          (state) => state.id === transition.targetStateId,
        ),
    ) // Ensure source and target states exist
    .map((transition, index) => ({
      id: `e${transition.sourceStateId}-${transition.targetStateId}-${index}`, // Add index to ensure uniqueness
      source: transition.sourceStateId!.toString(),
      target: transition.targetStateId!.toString(),
      label: transition.eventName,
      labelStyle: {
        fill: "var(--edge-label-color)",
        fontWeight: "500",
        fontSize: "0.75rem",
      },
      labelBgStyle: {
        fill: "var(--edge-label-bg)",
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [4, 4],
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: {
        stroke: "var(--edge-color)", // Edge color
        strokeWidth: 2,
      },
    }));
};

// Main Flow Component
export const WorkflowDiagram: React.FC<{
  workflowDetails: WorkflowDetailDTO;
}> = ({ workflowDetails }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [diagramHeight, setDiagramHeight] = useState("40rem");
  const [diagramDirection, setDiagramDirection] = useState<"TB" | "LR">("TB");

  // Re-layout the graph when direction changes
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutElements(
        nodes,
        edges,
        diagramDirection,
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [diagramDirection]);

  useEffect(() => {
    function initNodesAndEdges() {
      const initialNodes = convertStatesToNodes(workflowDetails);
      const initialEdges = convertTransitionsToEdges(workflowDetails);

      const nodeCount = initialNodes.length;
      let calculatedHeight = "40rem";
      if (nodeCount > 20) calculatedHeight = "60rem";
      else if (nodeCount > 10) calculatedHeight = "50rem";

      const shouldUseHorizontalLayout =
        nodeCount > 8 && initialEdges.length < nodeCount * 1.5;
      const direction = shouldUseHorizontalLayout ? "LR" : "TB";

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutElements(
        initialNodes,
        initialEdges,
        direction,
      );

      setDiagramDirection(direction);
      setDiagramHeight(calculatedHeight);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
    initNodesAndEdges();
  }, [workflowDetails, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: ConnectionLineType.SmoothStep, animated: true },
          eds,
        ),
      ),
    [setEdges],
  );

  const styles = {
    // Initial: primary bg → primary-foreground text (always contrasts)
    "--initial-node-bg": "hsl(var(--primary))",
    "--initial-node-text": "hsl(var(--primary-foreground))",
    // Final: destructive bg → destructive-foreground text
    "--final-node-bg": "hsl(var(--destructive))",
    "--final-node-text": "hsl(var(--destructive-foreground))",
    // Intermediate: muted bg → foreground text (readable in both light & dark)
    "--intermediate-node-bg": "hsl(var(--muted))",
    "--intermediate-node-text": "hsl(var(--muted-foreground))",
    "--node-border-color": "hsl(var(--border))",
    "--edge-color": "hsl(var(--muted-foreground))",
    "--edge-label-color": "hsl(var(--foreground))",
    "--edge-label-bg": "hsl(var(--muted))",
    "--background-color": "hsl(var(--card))",
    "--grid-color": "hsl(var(--border))",
  } as React.CSSProperties;

  return (
    <ReactFlowProvider>
      <div
        className="workflow-container w-full rounded-b-xl overflow-hidden"
        style={{
          ...styles,
          backgroundColor: "var(--background-color)",
          height: diagramHeight,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="var(--grid-color)"
          />
          <MiniMap
            nodeStrokeWidth={3}
            className="!bottom-2 !right-2 !rounded-md !border !shadow-sm"
            zoomable
            pannable
          />
          <Panel
            position="top-left"
            className="bg-background/80 px-3 py-2 rounded-md shadow-sm backdrop-blur border border-border"
          >
            <div className="flex flex-col gap-2">
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: "var(--initial-node-bg)" }}
                  />
                  <span>Initial</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: "var(--intermediate-node-bg)" }}
                  />
                  <span>Intermediate</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: "var(--final-node-bg)" }}
                  />
                  <span>Final</span>
                </div>
              </div>
              {/* Layout toggle */}
              <button
                onClick={() =>
                  setDiagramDirection(diagramDirection === "TB" ? "LR" : "TB")
                }
                className="text-left text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                {diagramDirection === "TB"
                  ? "→ Horizontal layout"
                  : "↓ Vertical layout"}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};
