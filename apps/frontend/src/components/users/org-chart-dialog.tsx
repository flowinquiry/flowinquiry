"use client";

import "@xyflow/react/dist/style.css";

import dagre from "@dagrejs/dagre";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { Network, ZoomIn, ZoomOut } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  setRootUserId,
}: {
  nodes: Node<Record<string, unknown>>[];
  edges: Edge<Record<string, unknown>>[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  setRootUserId: (id: number | undefined) => void;
}) => {
  const { zoomIn, zoomOut } = useReactFlow();
  const t = useAppClientTranslations();

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      {/* ── Org Chart canvas ── */}
      <div className="relative flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
          nodeTypes={{ custom: PersonNode }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            className="opacity-40"
          />
          <MiniMap
            nodeStrokeWidth={3}
            className="!bottom-2 !right-2 !rounded-md !border !shadow-sm"
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Zoom controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shadow-sm bg-background"
            onClick={() => zoomIn()}
            title={t.common.misc("zoom_in")}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shadow-sm bg-background"
            onClick={() => zoomOut()}
            title={t.common.misc("zoom_out")}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Instructions sidebar ── */}
      <div className="w-56 shrink-0 border-l flex flex-col bg-muted/30">
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Network className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">
              {t.users.org_chart_view("instruction_title")}
            </span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <ul className="px-4 py-4 space-y-3">
            {(
              [
                "instruction_desc1",
                "instruction_desc2",
                "instruction_desc3",
              ] as const
            ).map((key, i) => (
              <li
                key={key}
                className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                {t.users.org_chart_view(key)}
              </li>
            ))}
          </ul>
        </ScrollArea>
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

  const generateChart = (data: UserHierarchyDTO) => {
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
  };

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
  }, [rootUserId, isOpen]);

  useEffect(() => {
    if (!rootUser) return;
    const { nodes, edges } = generateChart(rootUser);
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
      nodes,
      edges,
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [rootUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-5xl w-full sm:!max-w-5xl md:!max-w-5xl lg:!max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Network className="h-4 w-4 text-primary" />
            </div>
            {t.users.common("org_chart")}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[580px] w-full">
          {isOpen && (
            <ReactFlowProvider>
              <OrgChartContent
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={(connection: any) => addEdge(connection, edges)}
                setRootUserId={setRootUserId}
              />
            </ReactFlowProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrgChartDialog;
