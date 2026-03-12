"use client";

import { ArrowRight, Lock } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { ReportDefinition } from "@/types/reports";

interface Props {
  report: ReportDefinition;
  isActive: boolean;
  onClick: (report: ReportDefinition) => void;
}

const ReportCard: React.FC<Props> = ({ report, isActive, onClick }) => {
  const isUpcoming = report.status === "upcoming";
  const Icon = report.icon;
  const t = useAppClientTranslations();

  return (
    <Card
      onClick={() => !isUpcoming && onClick(report)}
      className={cn(
        "relative flex flex-col gap-3 p-0 transition-all duration-150 overflow-hidden",
        isUpcoming
          ? "opacity-70 cursor-default"
          : "cursor-pointer hover:shadow-md hover:border-primary/50",
        isActive && "border-primary ring-2 ring-primary/30 shadow-md",
      )}
    >
      {/* Upcoming ribbon */}
      {isUpcoming && (
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="outline"
            className="text-xs gap-1 border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
          >
            <Lock className="w-3 h-3" />
            {t.teams.reports("status.upcoming")}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-start gap-3">
          {/* Icon chip */}
          <div
            className={cn(
              "shrink-0 rounded-lg p-2",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">
              {report.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.teams.reports(`chart_types.${report.chartType}`)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between gap-3">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {report.description}
        </p>

        {!isUpcoming && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isActive
              ? t.teams.reports("viewing")
              : t.teams.reports("open_report")}
            <ArrowRight className="w-3 h-3" />
          </div>
        )}

        {isUpcoming && (
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
            {t.teams.reports("upcoming_label")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportCard;
