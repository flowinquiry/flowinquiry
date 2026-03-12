import {
  BarChart2,
  Clock,
  GitBranch,
  Layers,
  PieChart,
  RadioTower,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import TicketChannelPieChart from "@/components/teams/team-tickets-channel-chart";
import TicketPriorityPieChart from "@/components/teams/team-tickets-priority-chart";
import { ReportDefinition } from "@/types/reports";

/**
 * Reports available on the project detail page.
 * Each chart is automatically scoped to the project via an `extraFilter`
 * injected by ProjectReportsView ({ field: "project.id", operator: "eq", value: projectId }).
 *
 * Charts that rely on old REST endpoints (timeseries, assignment distribution)
 * are listed as "upcoming" until they are migrated to the generic aggregate endpoint.
 */
export const PROJECT_REPORT_REGISTRY: ReportDefinition[] = [
  {
    id: "project-priority-distribution",
    category: "tickets",
    status: "available",
    title: "Tasks by Priority",
    description:
      "Distribution of task urgency across Critical, High, Medium, Low and Trivial within this project.",
    icon: PieChart,
    chartType: "pie",
    component: TicketPriorityPieChart,
    filterConfig: [
      { type: "status", field: "isCompleted" },
      { type: "assignee", field: "assignUser.id" },
    ],
  },
  {
    id: "project-channel-distribution",
    category: "tickets",
    status: "available",
    title: "Tasks by Channel",
    description:
      "See which intake channels generate the most tasks in this project.",
    icon: RadioTower,
    chartType: "pie",
    component: TicketChannelPieChart,
  },
  {
    id: "project-assignee-workload",
    category: "members",
    status: "upcoming",
    title: "Tasks per Assignee",
    description:
      "Compare open task counts across team members within this project to spot workload imbalances.",
    icon: Users,
    chartType: "bar",
    component: null,
  },
  {
    id: "project-daily-trend",
    category: "tickets",
    status: "upcoming",
    title: "Daily Task Trend",
    description:
      "Tasks created and closed each day within this project. Spot spikes and quiet periods.",
    icon: TrendingUp,
    chartType: "line",
    component: null,
  },
  {
    id: "project-sprint-burndown",
    category: "projects",
    status: "upcoming",
    title: "Sprint Burndown",
    description:
      "Remaining tasks vs. the ideal completion line over an iteration.",
    icon: Zap,
    chartType: "line",
    component: null,
  },
  {
    id: "project-epic-progress",
    category: "projects",
    status: "upcoming",
    title: "Epic Progress",
    description:
      "Stacked bar per epic showing done, in-progress, and not-started task counts.",
    icon: Layers,
    chartType: "bar",
    component: null,
  },
  {
    id: "project-resolution-time",
    category: "tickets",
    status: "upcoming",
    title: "Task Resolution Time",
    description:
      "Average, min and max time from task creation to completion, broken down by assignee.",
    icon: Clock,
    chartType: "bar",
    component: null,
  },
  {
    id: "project-velocity",
    category: "projects",
    status: "upcoming",
    title: "Project Velocity",
    description:
      "Tasks closed per iteration over time — helps predict delivery capacity.",
    icon: BarChart2,
    chartType: "bar",
    component: null,
  },
  {
    id: "project-workflow-funnel",
    category: "tickets",
    status: "upcoming",
    title: "Workflow State Funnel",
    description:
      "Visualise how tasks flow through each workflow state and where they accumulate.",
    icon: GitBranch,
    chartType: "funnel",
    component: null,
  },
];
