"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ImageCropper } from "@/components/image-cropper";
import { TeamAvatar } from "@/components/shared/avatar-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExtInputField,
  ExtTextAreaField,
  SubmitButton,
} from "@/components/ui/ext-form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useImageCropper } from "@/hooks/use-image-cropper";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  createTeam,
  findTeamById,
  updateTeam,
} from "@/lib/actions/teams.action";
import { obfuscate } from "@/lib/endecode";
import { validateForm } from "@/lib/validator";
import { useError } from "@/providers/error-provider";
import { TeamDTO, TeamDTOSchema } from "@/types/teams";

export const TeamForm = ({
  teamId,
  onSuccess,
  onCancel,
  isSheet = false,
}: {
  teamId: number | undefined;
  onSuccess?: (teamId: number) => void;
  onCancel?: () => void;
  isSheet?: boolean;
}) => {
  const router = useRouter();

  const {
    selectedFile,
    setSelectedFile,
    isDialogOpen,
    setDialogOpen,
    getRootProps,
    getInputProps,
  } = useImageCropper();

  const [team, setTeam] = useState<TeamDTO | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const form = useForm<TeamDTO>({
    resolver: zodResolver(TeamDTOSchema),
    defaultValues: undefined,
  });

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        if (teamId) {
          const data = await findTeamById(teamId, setError);
          if (!data) throw new Error("Team not found.");
          setTeam(data);
          form.reset(data);
        } else {
          setTeam(undefined);
          form.reset();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  useEffect(() => {
    if (team) {
      form.reset(team);
    } else {
      form.reset(undefined);
    }
  }, [team]);

  async function onSubmit(formValues: TeamDTO) {
    if (validateForm(formValues, TeamDTOSchema, form)) {
      const formData = new FormData();
      formData.append(
        "teamDTO",
        new Blob([JSON.stringify(formValues)], { type: "application/json" }),
      );
      if (selectedFile) formData.append("file", selectedFile);

      let redirectTeamId;
      if (formValues.id) {
        redirectTeamId = formValues.id;
        await updateTeam(formData, setError);
      } else {
        await createTeam(formData, setError).then(
          (data) => (redirectTeamId = data.id),
        );
      }
      if (onSuccess) {
        onSuccess(redirectTeamId!);
      } else {
        router.push(`/portal/teams/${obfuscate(redirectTeamId)}/dashboard`);
      }
    }
  }

  const isEdit = !!team;

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    ...(team
      ? [
          { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
          { title: t.common.buttons("edit"), link: "#" },
        ]
      : [{ title: t.common.buttons("add"), link: "#" }]),
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="team-form-loading">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <Separator />
        <div className="flex flex-col gap-4 max-w-3xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* logo row skeleton */}
              <div className="flex items-center gap-5 pb-2">
                <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={isSheet ? "flex flex-col gap-4" : "flex flex-col gap-4 flex-1"}
      data-testid="team-form-container"
    >
      {!isSheet && (
        <>
          <Breadcrumbs items={breadcrumbItems} />
          <Separator />
        </>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={
            isSheet ? "flex flex-col gap-6" : "flex flex-col flex-1 gap-6"
          }
          data-testid="team-form"
        >
          <div
            className={
              isSheet ? "flex flex-col gap-4" : "flex flex-col gap-4 max-w-3xl"
            }
          >
            {/* ── Details card (logo + fields together) ── */}
            <Card data-testid="team-form-details-section">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  {isEdit
                    ? t.teams.form("edit_team_title", { teamName: team?.name })
                    : t.teams.form("create_team_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Logo row at the top */}
                <div className="flex items-center gap-5 pb-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {selectedFile ? (
                          <div data-testid="team-form-logo-cropper">
                            <ImageCropper
                              dialogOpen={isDialogOpen}
                              setDialogOpen={setDialogOpen}
                              selectedFile={selectedFile}
                              setSelectedFile={setSelectedFile}
                            />
                          </div>
                        ) : (
                          <div data-testid="team-form-logo-upload">
                            <input {...getInputProps()} />
                            <TeamAvatar
                              {...getRootProps()}
                              imageUrl={team?.logoUrl}
                              size="w-20 h-20"
                              className="cursor-pointer ring-2 ring-offset-2 ring-muted hover:ring-primary transition-all"
                            />
                          </div>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t.teams.common("upload_team_logo")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div>
                    <p className="text-sm font-medium">
                      {t.teams.common("upload_team_logo")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.teams.form("logo_hint")}
                    </p>
                  </div>
                </div>

                <Separator />

                <ExtInputField
                  form={form}
                  required
                  fieldName="name"
                  label={t.teams.form("name")}
                  testId="team-form-name"
                />
                <ExtTextAreaField
                  form={form}
                  fieldName="slogan"
                  label={t.teams.form("slogan")}
                  testId="team-form-slogan"
                />
                <ExtTextAreaField
                  form={form}
                  fieldName="description"
                  label={t.teams.form("description")}
                  testId="team-form-description"
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Sticky save bar ── */}
          <div
            className={
              isSheet
                ? "flex items-center justify-end gap-3 border-t pt-4"
                : "mt-auto sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60"
            }
            data-testid="team-form-buttons"
          >
            <Button
              variant="outline"
              type="button"
              onClick={() => (onCancel ? onCancel() : router.back())}
              testId="team-form-discard"
            >
              {t.common.buttons("discard")}
            </Button>
            <SubmitButton
              label={
                isEdit
                  ? t.common.buttons("save_changes")
                  : t.common.buttons("create")
              }
              labelWhileLoading={
                isEdit
                  ? t.common.buttons("saving_changes")
                  : t.common.buttons("creating")
              }
              testId="team-form-submit"
            />
          </div>
        </form>
      </Form>
    </div>
  );
};
