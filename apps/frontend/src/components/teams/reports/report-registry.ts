import {
  BarChart2,
  BarChart3,
  Clock,
  FlameKindling,
  GitBranch,
  Layers,
  PieChart,
  RadioTower,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import TicketChannelPieChart from "@/components/teams/team-tickets-channel-chart";
import TicketDistributionChart from "@/components/teams/team-tickets-distribution-chart";
import TicketPriorityPieChart from "@/components/teams/team-tickets-priority-chart";
import TicketCreationByDaySeriesChart from "@/components/teams/tickets-creation-timeseries-chart";
import { ReportDefinition } from "@/types/reports";

/**
 * Central registry of all reports — built-in and upcoming.
 *
 * To add a new report:
 *   1. Append a new entry below with status "upcoming"
 *   2. When the chart is ready, set status → "available" and set component
 *
 * No other file needs to change.
 */
export const REPORT_REGISTRY: ReportDefinition[] = [
  // ── Tickets ──────────────────────────────────────────────────────────────

  {
    id: "ticket-trend",
    category: "tickets",
    status: "available",
    title: "Daily Ticket Trend",
    description:
      "Track tickets created and closed each day. Spot spikes and quiet periods at a glance.",
    icon: TrendingUp,
    chartType: "line",
    component: TicketCreationByDaySeriesChart,
  },
  {
    id: "channel-distribution",
    category: "tickets",
    status: "available",
    title: "Tickets by Channel",
    description:
      "See which intake channels (email, chat, portal, …) generate the most tickets.",
    icon: RadioTower,
    chartType: "pie",
    component: TicketChannelPieChart,
  },
  {
    id: "priority-distribution",
    category: "tickets",
    status: "available",
    title: "Tickets by Priority",
    description:
      "Understand the distribution of ticket urgency across Critical, High, Medium, Low and Trivial.",
    icon: PieChart,
    chartType: "pie",
    component: TicketPriorityPieChart,
    filterConfig: [
      { type: "status", field: "isCompleted" },
      { type: "assignee", field: "assignUser.id" },
    ],
  },
  {
    id: "assignee-workload",
    category: "tickets",
    status: "available",
    title: "Tickets per Assignee",
    description:
      "Compare open ticket counts across team members to spot workload imbalances.",
    icon: Users,
    chartType: "bar",
    component: TicketDistributionChart,
  },
  {
    id: "workflow-funnel",
    category: "tickets",
    status: "upcoming",
    title: "Workflow State Funnel",
    description:
      "Visualise how tickets flow through each workflow state and where they accumulate.",
    icon: GitBranch,
    chartType: "funnel",
    component: null,
  },
  {
    id: "resolution-time",
    category: "tickets",
    status: "upcoming",
    title: "Ticket Resolution Time",
    description:
      "Average, min and max time from ticket creation to completion, broken down by assignee.",
    icon: Clock,
    chartType: "bar",
    component: null,
  },
  {
    id: "sla-compliance",
    category: "tickets",
    status: "upcoming",
    title: "SLA Compliance Rate",
    description:
      "Percentage of tickets resolved on time versus late, per week or month.",
    icon: Shield,
    chartType: "bar",
    component: null,
  },
  {
    id: "health-distribution",
    category: "tickets",
    status: "upcoming",
    title: "Ticket Health Distribution",
    description:
      "Donut chart of active tickets by conversation health level (Excellent → Critical).",
    icon: FlameKindling,
    chartType: "pie",
    component: null,
  },

  // ── Projects ─────────────────────────────────────────────────────────────

  {
    id: "sprint-burndown",
    category: "projects",
    status: "upcoming",
    title: "Sprint Burndown",
    description:
      "Classic burndown chart showing remaining tickets vs. the ideal completion line over an iteration.",
    icon: Zap,
    chartType: "line",
    component: null,
  },
  {
    id: "epic-progress",
    category: "projects",
    status: "upcoming",
    title: "Epic Progress",
    description:
      "Stacked bar chart per epic showing done, in-progress, and not-started ticket counts.",
    icon: Layers,
    chartType: "bar",
    component: null,
  },
  {
    id: "project-velocity",
    category: "projects",
    status: "upcoming",
    title: "Project Velocity",
    description:
      "Tickets closed per iteration over time — helps predict how much the team can deliver.",
    icon: BarChart2,
    chartType: "bar",
    component: null,
  },

  // ── Members ──────────────────────────────────────────────────────────────

  {
    id: "member-activity",
    category: "members",
    status: "upcoming",
    title: "Member Activity Heatmap",
    description:
      "Hour × day-of-week heatmap showing when each member is most actively resolving tickets.",
    icon: BarChart3,
    chartType: "heatmap",
    component: null,
  },
  {
    id: "escalation-report",
    category: "members",
    status: "upcoming",
    title: "Escalation Report",
    description:
      "Tickets that triggered level-1, 2 or 3 SLA escalations — identify chronic SLA failures.",
    icon: RadioTower,
    chartType: "table",
    component: null,
  },
];

/** Quick lookup by id */
export const findReport = (id: string): ReportDefinition | undefined =>
  REPORT_REGISTRY.find((r) => r.id === id);

/** All distinct categories that have at least one report */
export const REPORT_CATEGORIES: ReportDefinition["category"][] = [
  "tickets",
  "projects",
  "members",
];
