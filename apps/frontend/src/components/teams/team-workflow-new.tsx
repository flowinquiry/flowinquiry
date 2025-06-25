"use client";

import React, { useState } from "react";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import TeamNavLayout from "@/components/teams/team-nav";
import NewTeamWorkflowReferFromSharedOne from "@/components/teams/team-workflow-new-refer-shared-workflow";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import NewWorkflowFromScratch from "@/components/workflows/workflow-create-from-scratch";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useTeam } from "@/providers/team-provider";

const TeamWorkflowNew = () => {
  const team = useTeam();
  const t = useAppClientTranslations();
  const [selectedOption, setSelectedOption] = useState<
    "scratch" | "clone" | null
  >(null);

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: team.name,
      link: `/portal/teams/${obfuscate(team.id)}`,
    },
    {
      title: t.common.navigation("workflows"),
      link: `/portal/teams/${obfuscate(team.id)}/workflows`,
    },
    { title: t.common.buttons("create"), link: "#" },
  ];

  const renderComponent = () => {
    switch (selectedOption) {
      case "scratch":
        return <NewWorkflowFromScratch teamId={team.id!} />;
      case "clone":
        return (
          <NewTeamWorkflowReferFromSharedOne
            teamId={team.id!}
            isRefer={false}
          />
        );
      default:
        return null;
    }
  };

  const isLink = !selectedOption;

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={team.id!}>
        <div className="grid grid-cols-1 gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger>
                  <TeamAvatar imageUrl={team.logoUrl} size="w-20 h-20" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                  <div className="text-left">
                    <p className="font-bold">{team.name}</p>
                    <p className="text-sm ">
                      {team.slogan ?? t.teams.common("default_slogan")}
                    </p>
                    {team.description && (
                      <p className="text-sm ">{team.description}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              <Heading
                title={t.workflows.add("title")}
                description={t.workflows.add("description")}
              />
            </div>
          </div>

          {/* Render selected component or options */}
          {isLink ? (
            <div>
              <h3 className="text-md font-semibold mb-4">
                {t.workflows.add("create_option")}
              </h3>
              <div className="space-y-6">
                {/* Create from Scratch */}
                <div className="flex items-start">
                  <Button
                    onClick={() => setSelectedOption("scratch")}
                    variant="link"
                    className="h-5"
                  >
                    {t.workflows.add("create_workflow_from_scratch_title")}
                  </Button>
                  <div className="text-sm ">
                    {t.workflows.add(
                      "create_workflow_from_scratch_description",
                    )}
                  </div>
                </div>

                {/* Clone from Global Workflow */}
                <div className="flex items-start">
                  <Button
                    onClick={() => setSelectedOption("clone")}
                    variant="link"
                    className="h-5"
                  >
                    {t.workflows.add("clone_workflow_title")}
                  </Button>
                  <div className="text-sm ">
                    {t.workflows.add("clone_workflow_description")}.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>{renderComponent()}</div>
          )}
        </div>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TeamWorkflowNew;
