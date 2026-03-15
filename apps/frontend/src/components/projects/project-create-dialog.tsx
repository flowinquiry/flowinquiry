"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Calendar,
  FileText,
  FolderOpen,
  InfoIcon,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import RichTextEditor from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DatePickerField,
  ExtInputField,
  SubmitButton,
} from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { createProject } from "@/lib/actions/project.action";
import { getTeamsContextByUserId } from "@/lib/actions/teams.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { ProjectDTO, ProjectSchema, ProjectStatus } from "@/types/projects";
import { UserTeamDTO } from "@/types/teams";

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-4 pl-2 border-l-2 border-primary/40">
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {title}
    </span>
  </div>
);

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreated?: () => void;
};

const ProjectCreateDialog: React.FC<Props> = ({ open, setOpen, onCreated }) => {
  const { data: session } = useSession();
  const { setError } = useError();
  const t = useAppClientTranslations();
  const router = useRouter();

  const [eligibleTeams, setEligibleTeams] = useState<UserTeamDTO[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const editorMountedRef = useRef(false);

  const form = useForm<z.infer<typeof ProjectSchema>>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      teamId: undefined as unknown as number,
      name: "",
      description: "",
      shortName: "",
      status: "Active" as ProjectStatus,
      startDate: undefined,
      endDate: undefined,
    },
  });

  // Load eligible teams when dialog opens
  useEffect(() => {
    if (!open || !session?.user?.id) return;
    editorMountedRef.current = true;
    form.reset({
      teamId: undefined as unknown as number,
      name: "",
      description: "",
      shortName: "",
      status: "Active",
      startDate: undefined,
      endDate: undefined,
    });

    const load = async () => {
      setLoadingTeams(true);
      try {
        const ctx = await getTeamsContextByUserId(
          Number(session.user.id),
          setError,
        );
        if (ctx) {
          const eligible = ctx.isAdmin
            ? ctx.teams
            : ctx.teams.filter((t) => t.roleName === "manager");
          setEligibleTeams(eligible);
        }
      } finally {
        setLoadingTeams(false);
      }
    };
    load();
  }, [open, session?.user?.id]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTimeout(() => {
        editorMountedRef.current = false;
      }, 100);
    }
    setOpen(next);
  };

  const onSubmit = async (data: ProjectDTO) => {
    const created = await createProject(data, setError);
    if (created) {
      handleOpenChange(false);
      onCreated?.();
      router.push(
        `/portal/teams/${obfuscate(created.teamId)}/projects/${created.shortName}`,
      );
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogContent
            className="sm:max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden"
            onPointerDownOutside={(e) => {
              if (
                e.target &&
                (e.target as HTMLElement).closest(".mention-dropdown-container")
              ) {
                e.preventDefault();
              }
            }}
          >
            {/* ── Header ── */}
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                {t.teams.projects.list("create_project_dialog_title")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5 pl-6">
                {t.teams.projects.new_dialog("new_project_description")}
              </p>
            </DialogHeader>

            {/* ── Form ── */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col flex-1 overflow-hidden min-h-0"
              >
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="flex flex-col gap-6">
                    {/* ── Team selector ── */}
                    <div>
                      <SectionHeader
                        icon={<FolderOpen className="h-4 w-4" />}
                        title={t.teams.projects.list(
                          "create_project_select_team_title",
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="teamId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t.teams.common("team")}
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(Number(v))}
                              value={field.value ? String(field.value) : ""}
                              disabled={loadingTeams}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingTeams
                                        ? t.common.misc("loading_data")
                                        : t.teams.projects.list(
                                            "create_project_select_team_title",
                                          )
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {eligibleTeams.map((team) => (
                                  <SelectItem
                                    key={team.teamId}
                                    value={String(team.teamId)}
                                  >
                                    {team.teamName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ── Basics ── */}
                    <div>
                      <SectionHeader
                        icon={<FileText className="h-4 w-4" />}
                        title={t.teams.projects.form("name")}
                      />
                      <div className="flex flex-col gap-4">
                        <ExtInputField
                          form={form}
                          fieldName="name"
                          label={t.teams.projects.form("name")}
                          required
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t.teams.projects.form("description")}
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                {editorMountedRef.current && (
                                  <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={() => {}}
                                    key={`editor-new-${open}`}
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Settings ── */}
                    <div>
                      <SectionHeader
                        icon={<Settings2 className="h-4 w-4" />}
                        title={t.teams.projects.form("status")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="shortName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                {t.teams.projects.form("short_name")}
                                <span className="text-destructive">*</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipPrimitive.Portal>
                                    <TooltipContent
                                      side="top"
                                      align="center"
                                      className="z-9999 max-w-xs"
                                      sideOffset={5}
                                    >
                                      <p>
                                        {t.teams.projects.form(
                                          "short_name_tooltip",
                                        )}
                                      </p>
                                    </TooltipContent>
                                  </TooltipPrimitive.Portal>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t.teams.projects.form(
                                    "short_name_placeholder",
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t.teams.projects.form("status")}
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Active">
                                    {t.teams.projects.list("status_active")}
                                  </SelectItem>
                                  <SelectItem value="Closed">
                                    {t.teams.projects.list("status_closed")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Dates ── */}
                    <div>
                      <SectionHeader
                        icon={<Calendar className="h-4 w-4" />}
                        title={t.teams.projects.form("start_date")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DatePickerField
                          form={form}
                          fieldName="startDate"
                          label={t.teams.projects.form("start_date")}
                          placeholder={t.common.misc(
                            "date_select_place_holder",
                          )}
                        />
                        <DatePickerField
                          form={form}
                          fieldName="endDate"
                          label={t.teams.projects.form("end_date")}
                          placeholder={t.common.misc(
                            "date_select_place_holder",
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    {t.common.buttons("cancel")}
                  </Button>
                  <SubmitButton
                    label={t.common.buttons("save")}
                    labelWhileLoading={t.common.buttons("saving")}
                  />
                </div>
              </form>
            </Form>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </TooltipProvider>
  );
};

export default ProjectCreateDialog;
