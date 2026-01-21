"use client";

import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import {
  addEdge,
  Background,
  Connection,
  Edge,
  EdgeChange,
  MarkerType,
  Node,
  NodeChange,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PersonNode from "@/components/users/org-chart-node";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getOrgChart, getUserHierarchy } from "@/lib/actions/users.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";

// Define the type for the user hierarchy DTO
export interface UserHierarchyDTO {
  id: number;
  name: string;
  imageUrl: string;
  managerId: number | null;
  managerName: string | null;
  managerImageUrl: string | null;
  subordinates: UserHierarchyDTO[];
}

const nodeWidth = 200;
const nodeHeight = 100;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
dagreGraph.setGraph({ rankdir: "TB" });

const applyLayout = (
  nodes: Node<Record<string, unknown>>[],
  edges: Edge<Record<string, unknown>>[],
) => {
  dagreGraph.nodes().forEach((node) => dagreGraph.removeNode(node));
  dagreGraph.edges().forEach(({ v, w }) => dagreGraph.removeEdge(v, w));

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const position = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: position.x - nodeWidth / 2,
          y: position.y - nodeHeight / 2,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node<Record<string, unknown>>;
    }),
    edges,
  };
};

const OrgChartContent = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: {
  nodes: Node<Record<string, unknown>>[];
  edges: Edge<Record<string, unknown>>[];
  onNodesChange: (changes: NodeChange<Node<Record<string, unknown>>>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge<Record<string, unknown>>>[]) => void;
  onConnect: (connection: Connection) => void;
}) => {
  const { zoomIn, zoomOut } = useReactFlow();
  const t = useAppClientTranslations();

  return (
    <div className="flex h-full w-full">
      {/* Org Chart */}
      <div className="relative grow h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
          nodeTypes={{ custom: PersonNode }}
        >
          <Background gap={16} size={0.5} />
        </ReactFlow>
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <Button variant="outline" onClick={() => zoomIn()}>
            {t.common.misc("zoom_in")}
          </Button>
          <Button variant="outline" onClick={() => zoomOut()}>
            {t.common.misc("zoom_out")}
          </Button>
        </div>
      </div>

      {/* Instructions Sidebar */}
      <div className="w-64 p-4 border-l border-gray-200 bg-gray-50 dark:bg-gray-800 overflow-auto">
        <h2 className="font-bold mb-4">
          {t.users.org_chart_view("instruction_title")}
        </h2>
        <ul className="list-disc ml-4 space-y-2">
          <li>{t.users.org_chart_view("instruction_desc1")}</li>
          <li>{t.users.org_chart_view("instruction_desc2")}</li>
          <li>{t.users.org_chart_view("instruction_desc3")}</li>
        </ul>
      </div>
    </div>
  );
};

const OrgChartDialog = ({
  userId,
  isOpen,
  onClose,
}: {
  userId?: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { setError } = useError();
  const [rootUserId, setRootUserId] = useState<number | undefined>(userId);
  const [rootUser, setRootUser] = useState<UserHierarchyDTO | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<Record<string, unknown>>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<
    Edge<Record<string, unknown>>
  >([]);
  const DUMMY_MANAGER_ID = -1;
  const t = useAppClientTranslations();

  const generateChart = useCallback(
    (data: UserHierarchyDTO) => {
      const nodes: Node<Record<string, unknown>>[] = [];
      const edges: Edge<Record<string, unknown>>[] = [];

      if (data.id === DUMMY_MANAGER_ID) {
        nodes.push({
          id: DUMMY_MANAGER_ID.toString(),
          type: "custom",
          data: {
            label: "Top-Level Manager",
            avatarUrl: "",
            userPageLink: "#",
            onClick: () => setRootUserId(DUMMY_MANAGER_ID),
          },
          position: { x: 0, y: 0 },
        });

        data.subordinates.forEach((sub) => {
          nodes.push({
            id: sub.id.toString(),
            type: "custom",
            data: {
              label: sub.name,
              avatarUrl: sub.imageUrl,
              userPageLink: `/portal/users/${obfuscate(sub.id)}`,
              onClick: () => setRootUserId(sub.id),
            },
            position: { x: 0, y: 0 },
          });

          edges.push({
            id: `e${DUMMY_MANAGER_ID}-${sub.id}`,
            source: DUMMY_MANAGER_ID.toString(),
            target: sub.id.toString(),
            animated: true,
            markerEnd: { type: MarkerType.Arrow },
          });
        });

        return { nodes, edges };
      }

      // ...existing code...
      if (data.managerId) {
        nodes.push({
          id: data.managerId.toString(),
          type: "custom",
          data: {
            label: data.managerName,
            avatarUrl: data.managerImageUrl,
            userPageLink: `/portal/users/${obfuscate(data.managerId)}`,
            onClick: () => setRootUserId(data.managerId ?? undefined),
          },
          position: { x: 0, y: 0 },
        });

        edges.push({
          id: `e${data.managerId}-${data.id}`,
          source: data.managerId.toString(),
          target: data.id.toString(),
          animated: true,
          markerEnd: { type: MarkerType.Arrow },
        });
      }

      nodes.push({
        id: data.id.toString(),
        type: "custom",
        data: {
          label: data.name,
          avatarUrl: data.imageUrl,
          userPageLink: `/portal/users/${obfuscate(data.id)}`,
          onClick: () => setRootUserId(data.id),
        },
        position: { x: 0, y: 0 },
      });

      data.subordinates.forEach((sub) => {
        nodes.push({
          id: sub.id.toString(),
          type: "custom",
          data: {
            label: sub.name,
            avatarUrl: sub.imageUrl,
            userPageLink: `/portal/users/${obfuscate(sub.id)}`,
            onClick: () => setRootUserId(sub.id),
          },
          position: { x: 0, y: 0 },
        });

        edges.push({
          id: `e${data.id}-${sub.id}`,
          source: data.id.toString(),
          target: sub.id.toString(),
          animated: true,
          markerEnd: { type: MarkerType.Arrow },
        });
      });

      return { nodes, edges };
    },
    [DUMMY_MANAGER_ID, setRootUserId],
  );

  useEffect(() => {
    if (!isOpen) return;

    const loadOrgChart = async () => {
      const data =
        rootUserId === DUMMY_MANAGER_ID
          ? await getOrgChart(setError)
          : rootUserId === undefined
            ? await getOrgChart(setError)
            : await getUserHierarchy(rootUserId, setError);
      setRootUser(data);
    };

    loadOrgChart();
  }, [rootUserId, isOpen, DUMMY_MANAGER_ID, setError]);

  useEffect(() => {
    if (!rootUser) return;
    const { nodes, edges } = generateChart(rootUser);
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
      nodes,
      edges,
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [rootUser, generateChart, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-7xl w-full sm:!max-w-7xl md:!max-w-7xl lg:!max-w-7xl">
        <DialogHeader>
          <DialogTitle>{t.users.common("org_chart")}</DialogTitle>
        </DialogHeader>
        <div className="h-[500px] w-full">
          {isOpen && (
            <ReactFlowProvider>
              <OrgChartContent
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
              />
            </ReactFlowProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartDialog;
