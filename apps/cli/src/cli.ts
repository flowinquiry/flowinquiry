import { Command } from "commander";
import { loadConfig } from "./config";
import { printError, printJson } from "./output";
import { buildPagination, buildQueryFromOptions } from "./commands/helpers";
import { parseJsonInput, parseNumberList, parsePriority } from "./utils";
import * as auth from "./commands/auth";
import * as users from "./commands/users";
import * as authorities from "./commands/authorities";
import * as authorityPermissions from "./commands/authorityPermissions";
import * as resources from "./commands/resources";
import * as teams from "./commands/teams";
import * as organizations from "./commands/organizations";
import * as workflows from "./commands/workflows";
import * as projects from "./commands/projects";
import * as iterations from "./commands/iterations";
import * as epics from "./commands/epics";
import * as projectSettings from "./commands/projectSettings";
import * as tickets from "./commands/tickets";
import * as reports from "./commands/reports";
import * as comments from "./commands/comments";
import * as notifications from "./commands/notifications";
import * as activity from "./commands/activity";
import * as watchers from "./commands/watchers";
import * as appSettings from "./commands/appSettings";
import * as files from "./commands/files";
import * as shared from "./commands/shared";
import { streamSse } from "./http";

const collectValues = (value: string, previous: string[]) => {
  previous.push(value);
  return previous;
};

type ConfigOptions = {
  requireToken?: boolean;
};

type ActionOptions = {
  print?: boolean;
  config?: ConfigOptions;
};

function actionWithConfig<T>(
  program: Command,
  handler: (config: ReturnType<typeof loadConfig>, options: any) => Promise<T>,
  actionOptions: ActionOptions = {},
) {
  return async (options: any) => {
    try {
      const config = loadConfig(program.opts().baseUrl, actionOptions.config);
      const result = await handler(config, options);
      if (actionOptions.print !== false && result !== undefined) {
        printJson(result);
      }
    } catch (error) {
      printError(error);
      process.exitCode = 1;
    }
  };
}

function withPagination(command: Command) {
  return command
    .option("--page <number>", "Page number", "1")
    .option("--size <number>", "Page size", "20")
    .option("--sort-field <field>", "Sort field")
    .option("--sort-direction <direction>", "Sort direction", "asc");
}

function withFilters(command: Command) {
  return command
    .option("--filter <filter>", "Filter as field:op:value", collectValues, [])
    .option("--filter-json <json>", "Raw QueryDTO JSON");
}

function parseJsonOption<T>(options: any, key: string, label: string): T {
  if (!options[key]) {
    throw new Error(`${label} is required. Provide --${key} '<json>'`);
  }
  return parseJsonInput<T>(options[key], label);
}

export function createProgram() {
  const program = new Command();

  program
    .name("fi")
    .description("FlowInquiry CLI")
    .option("--base-url <url>", "FlowInquiry API base URL");

  program
    .command("help")
    .description("Show CLI help")
    .action(() => {
      program.outputHelp();
    });

  const authGroup = program.command("auth").description("Authentication helpers");

  authGroup
    .command("authenticate")
    .description("Authenticate and return JWT token")
    .requiredOption("--email <email>", "Email")
    .requiredOption("--password <password>", "Password")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.authenticate(config, options.email, options.password),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("login")
    .description("Login and return user profile")
    .requiredOption("--email <email>", "Email")
    .requiredOption("--password <password>", "Password")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.login(config, options.email, options.password),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("session")
    .description("Check authentication session")
    .action(actionWithConfig(program, (config) => auth.session(config)));

  authGroup
    .command("register")
    .description("Register a new account")
    .requiredOption("--json <json>", "Registration payload JSON")
    .action(
      actionWithConfig(
        program,
        (config, options) =>
          auth.register(
            config,
            parseJsonOption(options, "json", "Registration JSON"),
          ),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("resend-activation")
    .description("Resend activation email")
    .requiredOption("--email <email>", "Email")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.resendActivation(config, options.email),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("activate")
    .description("Activate account with key")
    .requiredOption("--key <key>", "Activation key")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.activate(config, options.key),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("whoami")
    .description("Return current account")
    .action(actionWithConfig(program, (config) => auth.whoami(config)));

  authGroup
    .command("account-update")
    .description("Update current account")
    .requiredOption("--json <json>", "Account payload JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        auth.updateAccount(config, parseJsonOption(options, "json", "Account JSON")),
      ),
    );

  authGroup
    .command("change-password")
    .description("Change current password")
    .requiredOption("--current <password>", "Current password")
    .requiredOption("--new <password>", "New password")
    .action(
      actionWithConfig(program, (config, options) =>
        auth.changePassword(config, options.current, options.new),
      ),
    );

  authGroup
    .command("reset-password-init")
    .description("Request password reset email")
    .requiredOption("--email <email>", "Email")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.resetPasswordInit(config, options.email),
        { config: { requireToken: false } },
      ),
    );

  authGroup
    .command("reset-password-finish")
    .description("Complete password reset")
    .requiredOption("--key <key>", "Reset key")
    .requiredOption("--new <password>", "New password")
    .action(
      actionWithConfig(
        program,
        (config, options) => auth.resetPasswordFinish(config, options.key, options.new),
        { config: { requireToken: false } },
      ),
    );

  const userGroup = program.command("user").description("User operations");

  withFilters(withPagination(userGroup.command("search").description("Search users")))
    .action(
      actionWithConfig(program, (config, options) =>
        users.searchUsers(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  userGroup
    .command("get")
    .description("Get user by id")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        users.getUser(config, Number(options.userId)),
      ),
    );

  userGroup
    .command("create")
    .description("Create a user")
    .requiredOption("--json <json>", "User payload JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        users.createUser(config, parseJsonOption(options, "json", "User JSON")),
      ),
    );

  userGroup
    .command("update")
    .description("Update a user (multipart)")
    .requiredOption("--json <json>", "User payload JSON")
    .option("--avatar <path>", "Avatar image path")
    .action(
      actionWithConfig(program, (config, options) =>
        users.updateUser(
          config,
          parseJsonOption(options, "json", "User JSON"),
          options.avatar,
        ),
      ),
    );

  userGroup
    .command("delete")
    .description("Delete a user")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        users.deleteUser(config, Number(options.userId)),
      ),
    );

  userGroup
    .command("permissions")
    .description("Get user permissions")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        users.getUserPermissions(config, Number(options.userId)),
      ),
    );

  userGroup
    .command("direct-reports")
    .description("List direct reports for manager")
    .requiredOption("--manager-id <id>", "Manager id")
    .action(
      actionWithConfig(program, (config, options) =>
        users.getDirectReports(config, Number(options.managerId)),
      ),
    );

  userGroup
    .command("hierarchy")
    .description("Get user hierarchy")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        users.getUserHierarchy(config, Number(options.userId)),
      ),
    );

  userGroup
    .command("org-chart")
    .description("Get organization chart")
    .action(actionWithConfig(program, (config) => users.getOrgChart(config)));

  userGroup
    .command("search-term")
    .description("Search users by term")
    .requiredOption("--term <term>", "Search term")
    .action(
      actionWithConfig(program, (config, options) =>
        users.searchUsersByTerm(config, options.term),
      ),
    );

  userGroup
    .command("locale")
    .description("Update current user locale")
    .requiredOption("--lang <langKey>", "Language key")
    .action(
      actionWithConfig(program, (config, options) =>
        users.updateLocale(config, options.lang),
      ),
    );

  const authorityGroup = program
    .command("authority")
    .description("Authority operations");

  authorityGroup
    .command("create")
    .description("Create authority")
    .requiredOption("--json <json>", "Authority payload JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.createAuthority(
          config,
          parseJsonOption(options, "json", "Authority JSON"),
        ),
      ),
    );

  withPagination(authorityGroup.command("list").description("List authorities"))
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.listAuthorities(config, buildPagination(options)),
      ),
    );

  authorityGroup
    .command("get")
    .description("Get authority")
    .requiredOption("--name <name>", "Authority name")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.getAuthority(config, options.name),
      ),
    );

  authorityGroup
    .command("delete")
    .description("Delete authority")
    .requiredOption("--id <id>", "Authority id")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.deleteAuthority(config, options.id),
      ),
    );

  withPagination(
    authorityGroup.command("users").description("List users in authority"),
  )
    .requiredOption("--name <name>", "Authority name")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.getUsersByAuthority(
          config,
          options.name,
          buildPagination(options),
        ),
      ),
    );

  authorityGroup
    .command("search-not-in")
    .description("Search users not in authority")
    .requiredOption("--name <name>", "Authority name")
    .requiredOption("--term <term>", "Search term")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.searchUsersNotInAuthority(config, options.name, options.term),
      ),
    );

  authorityGroup
    .command("add-users")
    .description("Add users to authority")
    .requiredOption("--name <name>", "Authority name")
    .requiredOption("--user-ids <ids>", "Comma-separated user ids")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.addUsersToAuthority(
          config,
          options.name,
          parseNumberList(options.userIds),
        ),
      ),
    );

  authorityGroup
    .command("remove-user")
    .description("Remove user from authority")
    .requiredOption("--name <name>", "Authority name")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        authorities.removeUserFromAuthority(
          config,
          options.name,
          Number(options.userId),
        ),
      ),
    );

  const permissionGroup = program
    .command("authority-permission")
    .description("Authority resource permissions");

  permissionGroup
    .command("get")
    .description("Get permissions for authority")
    .requiredOption("--name <name>", "Authority name")
    .action(
      actionWithConfig(program, (config, options) =>
        authorityPermissions.getAuthorityPermissions(config, options.name),
      ),
    );

  permissionGroup
    .command("batch-save")
    .description("Save authority permissions")
    .requiredOption("--json <json>", "Permissions JSON array")
    .action(
      actionWithConfig(program, (config, options) =>
        authorityPermissions.saveAuthorityPermissions(
          config,
          parseJsonOption(options, "json", "Permissions JSON"),
        ),
      ),
    );

  const resourceGroup = program
    .command("resource")
    .description("Resource operations");

  resourceGroup
    .command("list")
    .description("List resources")
    .action(actionWithConfig(program, (config) => resources.listResources(config)));

  const teamGroup = program.command("team").description("Team operations");

  withFilters(withPagination(teamGroup.command("list").description("List teams")))
    .action(
      actionWithConfig(program, (config, options) =>
        teams.listTeams(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  teamGroup
    .command("get")
    .description("Get team by id")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.getTeam(config, Number(options.teamId)),
      ),
    );

  teamGroup
    .command("create")
    .description("Create team (multipart)")
    .requiredOption("--json <json>", "Team payload JSON")
    .option("--logo <path>", "Logo image path")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.createTeam(
          config,
          parseJsonOption(options, "json", "Team JSON"),
          options.logo,
        ),
      ),
    );

  teamGroup
    .command("update")
    .description("Update team (multipart)")
    .requiredOption("--json <json>", "Team payload JSON")
    .option("--logo <path>", "Logo image path")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.updateTeam(
          config,
          parseJsonOption(options, "json", "Team JSON"),
          options.logo,
        ),
      ),
    );

  teamGroup
    .command("delete")
    .description("Delete team")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.deleteTeam(config, Number(options.teamId)),
      ),
    );

  teamGroup
    .command("delete-bulk")
    .description("Delete multiple teams")
    .requiredOption("--team-ids <ids>", "Comma-separated team ids")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.deleteTeams(config, parseNumberList(options.teamIds)),
      ),
    );

  teamGroup
    .command("users")
    .description("List users for a team")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.listTeamUsers(config, Number(options.teamId)),
      ),
    );

  teamGroup
    .command("by-user")
    .description("List teams for a user")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.getTeamsByUser(config, Number(options.userId)),
      ),
    );

  teamGroup
    .command("add-users")
    .description("Add users to team")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--user-ids <ids>", "Comma-separated user ids")
    .requiredOption("--role <role>", "Role")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.addUsersToTeam(
          config,
          Number(options.teamId),
          parseNumberList(options.userIds),
          options.role,
        ),
      ),
    );

  teamGroup
    .command("search-users-not-in")
    .description("Search users not in team")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--term <term>", "Search term")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.searchUsersNotInTeam(config, Number(options.teamId), options.term),
      ),
    );

  teamGroup
    .command("remove-user")
    .description("Remove user from team")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.removeUserFromTeam(
          config,
          Number(options.teamId),
          Number(options.userId),
        ),
      ),
    );

  teamGroup
    .command("user-role")
    .description("Get user role in team")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.getUserRoleInTeam(
          config,
          Number(options.teamId),
          Number(options.userId),
        ),
      ),
    );

  teamGroup
    .command("has-manager")
    .description("Check if team has manager")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        teams.hasManager(config, Number(options.teamId)),
      ),
    );

  const orgGroup = program
    .command("org")
    .description("Organization operations");

  orgGroup
    .command("create")
    .description("Create organization")
    .requiredOption("--json <json>", "Organization JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        organizations.createOrganization(
          config,
          parseJsonOption(options, "json", "Organization JSON"),
        ),
      ),
    );

  orgGroup
    .command("update")
    .description("Update organization")
    .requiredOption("--org-id <id>", "Organization id")
    .requiredOption("--json <json>", "Organization JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        organizations.updateOrganization(
          config,
          Number(options.orgId),
          parseJsonOption(options, "json", "Organization JSON"),
        ),
      ),
    );

  orgGroup
    .command("delete")
    .description("Delete organization")
    .requiredOption("--org-id <id>", "Organization id")
    .action(
      actionWithConfig(program, (config, options) =>
        organizations.deleteOrganization(config, Number(options.orgId)),
      ),
    );

  orgGroup
    .command("get")
    .description("Get organization")
    .requiredOption("--org-id <id>", "Organization id")
    .action(
      actionWithConfig(program, (config, options) =>
        organizations.getOrganization(config, Number(options.orgId)),
      ),
    );

  withFilters(withPagination(orgGroup.command("search").description("Search organizations")))
    .action(
      actionWithConfig(program, (config, options) =>
        organizations.searchOrganizations(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  const workflowGroup = program
    .command("workflow")
    .description("Workflow operations");

  withFilters(withPagination(workflowGroup.command("search").description("Search workflows")))
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.searchWorkflows(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  workflowGroup
    .command("get")
    .description("Get workflow")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.getWorkflow(config, Number(options.workflowId)),
      ),
    );

  workflowGroup
    .command("update")
    .description("Update workflow")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .requiredOption("--json <json>", "Workflow JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.updateWorkflow(
          config,
          Number(options.workflowId),
          parseJsonOption(options, "json", "Workflow JSON"),
        ),
      ),
    );

  workflowGroup
    .command("delete")
    .description("Delete workflow")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.deleteWorkflow(config, Number(options.workflowId)),
      ),
    );

  workflowGroup
    .command("list")
    .description("List workflows for a team")
    .requiredOption("--team-id <id>", "Team id")
    .option("--used-for-project <bool>", "Filter by project workflows")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.listWorkflowsForTeamUsedForProject(
          config,
          Number(options.teamId),
          options.usedForProject === undefined
            ? undefined
            : options.usedForProject === "true",
        ),
      ),
    );

  workflowGroup
    .command("remove-team")
    .description("Remove workflow from team")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.deleteTeamWorkflow(
          config,
          Number(options.workflowId),
          Number(options.teamId),
        ),
      ),
    );

  workflowGroup
    .command("global-not-linked")
    .description("List global workflows not linked to team")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.listGlobalWorkflowsNotLinked(config, Number(options.teamId)),
      ),
    );

  workflowGroup
    .command("transitions")
    .description("List valid transitions")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .requiredOption("--state-id <id>", "Workflow state id")
    .option("--include-self", "Include current state", false)
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.getWorkflowTransitions(
          config,
          Number(options.workflowId),
          Number(options.stateId),
          Boolean(options.includeSelf),
        ),
      ),
    );

  workflowGroup
    .command("initial-states")
    .description("List workflow initial states")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.getWorkflowInitialStates(config, Number(options.workflowId)),
      ),
    );

  workflowGroup
    .command("project")
    .description("Get project workflow for team")
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.getProjectWorkflowByTeam(config, Number(options.teamId)),
      ),
    );

  workflowGroup
    .command("details")
    .description("Get workflow details")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.getWorkflowDetail(config, Number(options.workflowId)),
      ),
    );

  workflowGroup
    .command("details-create")
    .description("Create workflow with details")
    .requiredOption("--json <json>", "Workflow details JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.createWorkflowDetail(
          config,
          parseJsonOption(options, "json", "Workflow details JSON"),
        ),
      ),
    );

  workflowGroup
    .command("details-update")
    .description("Update workflow details")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .requiredOption("--json <json>", "Workflow details JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.updateWorkflowDetail(
          config,
          Number(options.workflowId),
          parseJsonOption(options, "json", "Workflow details JSON"),
        ),
      ),
    );

  workflowGroup
    .command("create-reference")
    .description("Create workflow by reference")
    .requiredOption("--ref-id <id>", "Referenced workflow id")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--json <json>", "Workflow JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.createWorkflowReference(
          config,
          Number(options.refId),
          Number(options.teamId),
          parseJsonOption(options, "json", "Workflow JSON"),
        ),
      ),
    );

  workflowGroup
    .command("create-clone")
    .description("Create workflow by cloning")
    .requiredOption("--clone-id <id>", "Workflow id to clone")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--json <json>", "Workflow JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        workflows.createWorkflowClone(
          config,
          Number(options.cloneId),
          Number(options.teamId),
          parseJsonOption(options, "json", "Workflow JSON"),
        ),
      ),
    );

  const projectGroup = program
    .command("project")
    .description("Project operations");

  withFilters(withPagination(projectGroup.command("search").description("Search projects")))
    .action(
      actionWithConfig(program, (config, options) =>
        projects.listProjects(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  projectGroup
    .command("get")
    .description("Get project by id")
    .requiredOption("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.getProject(config, Number(options.projectId)),
      ),
    );

  projectGroup
    .command("create")
    .description("Create project")
    .requiredOption("--json <json>", "Project JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.createProject(
          config,
          parseJsonOption(options, "json", "Project JSON"),
        ),
      ),
    );

  projectGroup
    .command("update")
    .description("Update project")
    .requiredOption("--project-id <id>", "Project id")
    .requiredOption("--json <json>", "Project JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.updateProject(
          config,
          Number(options.projectId),
          parseJsonOption(options, "json", "Project JSON"),
        ),
      ),
    );

  projectGroup
    .command("delete")
    .description("Delete project")
    .requiredOption("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.deleteProject(config, Number(options.projectId)),
      ),
    );

  withFilters(withPagination(projectGroup.command("export").description("Export projects")))
    .requiredOption("--format <format>", "csv or xlsx")
    .requiredOption("--out <path>", "Output file path")
    .action(
      actionWithConfig(
        program,
        (config, options) => {
          const accept =
            options.format === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/csv";
          return projects.exportProjects(
            config,
            buildPagination(options),
            buildQueryFromOptions(options),
            accept,
            options.out,
          );
        },
        { print: false },
      ),
    );

  projectGroup
    .command("iterations")
    .description("List project iterations")
    .requiredOption("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.getProjectIterations(config, Number(options.projectId)),
      ),
    );

  projectGroup
    .command("epics")
    .description("List project epics")
    .requiredOption("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.getProjectEpics(config, Number(options.projectId)),
      ),
    );

  projectGroup
    .command("short-name")
    .description("Get project by short name")
    .requiredOption("--short-name <name>", "Short name")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.getProjectByShortName(config, options.shortName),
      ),
    );

  withPagination(projectGroup.command("by-user").description("List projects by user"))
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        projects.getProjectsByUser(
          config,
          Number(options.userId),
          buildPagination(options),
        ),
      ),
    );

  const iterationGroup = program
    .command("iteration")
    .description("Project iteration operations");

  iterationGroup
    .command("get")
    .description("Get iteration")
    .requiredOption("--iteration-id <id>", "Iteration id")
    .action(
      actionWithConfig(program, (config, options) =>
        iterations.getIteration(config, Number(options.iterationId)),
      ),
    );

  iterationGroup
    .command("create")
    .description("Create iteration")
    .requiredOption("--json <json>", "Iteration JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        iterations.createIteration(
          config,
          parseJsonOption(options, "json", "Iteration JSON"),
        ),
      ),
    );

  iterationGroup
    .command("update")
    .description("Update iteration")
    .requiredOption("--iteration-id <id>", "Iteration id")
    .requiredOption("--json <json>", "Iteration JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        iterations.updateIteration(
          config,
          Number(options.iterationId),
          parseJsonOption(options, "json", "Iteration JSON"),
        ),
      ),
    );

  iterationGroup
    .command("delete")
    .description("Delete iteration")
    .requiredOption("--iteration-id <id>", "Iteration id")
    .action(
      actionWithConfig(program, (config, options) =>
        iterations.deleteIteration(config, Number(options.iterationId)),
      ),
    );

  iterationGroup
    .command("close")
    .description("Close iteration")
    .requiredOption("--iteration-id <id>", "Iteration id")
    .action(
      actionWithConfig(program, (config, options) =>
        iterations.closeIteration(config, Number(options.iterationId)),
      ),
    );

  const epicGroup = program
    .command("epic")
    .description("Project epic operations");

  epicGroup
    .command("get")
    .description("Get epic")
    .requiredOption("--epic-id <id>", "Epic id")
    .action(
      actionWithConfig(program, (config, options) =>
        epics.getEpic(config, Number(options.epicId)),
      ),
    );

  epicGroup
    .command("create")
    .description("Create epic")
    .requiredOption("--json <json>", "Epic JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        epics.createEpic(config, parseJsonOption(options, "json", "Epic JSON")),
      ),
    );

  epicGroup
    .command("update")
    .description("Update epic")
    .requiredOption("--epic-id <id>", "Epic id")
    .requiredOption("--json <json>", "Epic JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        epics.updateEpic(
          config,
          Number(options.epicId),
          parseJsonOption(options, "json", "Epic JSON"),
        ),
      ),
    );

  epicGroup
    .command("delete")
    .description("Delete epic")
    .requiredOption("--epic-id <id>", "Epic id")
    .action(
      actionWithConfig(program, (config, options) =>
        epics.deleteEpic(config, Number(options.epicId)),
      ),
    );

  const projectSettingGroup = program
    .command("project-setting")
    .description("Project settings operations");

  projectSettingGroup
    .command("get")
    .description("Get project settings")
    .requiredOption("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        projectSettings.getProjectSettings(config, Number(options.projectId)),
      ),
    );

  projectSettingGroup
    .command("create")
    .description("Create project settings")
    .requiredOption("--json <json>", "Project settings JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        projectSettings.createProjectSettings(
          config,
          parseJsonOption(options, "json", "Project settings JSON"),
        ),
      ),
    );

  projectSettingGroup
    .command("update")
    .description("Update project settings")
    .requiredOption("--project-id <id>", "Project id")
    .requiredOption("--json <json>", "Project settings JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        projectSettings.updateProjectSettings(
          config,
          Number(options.projectId),
          parseJsonOption(options, "json", "Project settings JSON"),
        ),
      ),
    );

  const ticketGroup = program.command("ticket").description("Ticket operations");

  ticketGroup
    .command("create")
    .description("Create a ticket")
    .requiredOption("--team-id <id>", "Team id")
    .requiredOption("--workflow-id <id>", "Workflow id")
    .requiredOption("--state-id <id>", "Workflow state id")
    .requiredOption("--requester-id <id>", "Requester user id")
    .requiredOption("--priority <priority>", "Priority")
    .requiredOption("--title <title>", "Ticket title")
    .requiredOption("--description <description>", "Ticket description")
    .action(
      actionWithConfig(program, (config, options) => {
        const priority = parsePriority(options.priority);
        return tickets.createTicket(config, {
          teamId: Number(options.teamId),
          workflowId: Number(options.workflowId),
          stateId: Number(options.stateId),
          requesterId: Number(options.requesterId),
          priority,
          title: options.title,
          description: options.description,
        });
      }),
    );

  withFilters(withPagination(ticketGroup.command("search").description("Search tickets")))
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.searchTickets(
          config,
          buildPagination(options),
          buildQueryFromOptions(options),
        ),
      ),
    );

  ticketGroup
    .command("get")
    .description("Get ticket")
    .requiredOption("--ticket-id <id>", "Ticket id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTicket(config, Number(options.ticketId)),
      ),
    );

  ticketGroup
    .command("update")
    .description("Update ticket")
    .requiredOption("--ticket-id <id>", "Ticket id")
    .requiredOption("--json <json>", "Ticket JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.updateTicket(
          config,
          Number(options.ticketId),
          parseJsonOption(options, "json", "Ticket JSON"),
        ),
      ),
    );

  ticketGroup
    .command("delete")
    .description("Delete ticket")
    .requiredOption("--ticket-id <id>", "Ticket id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.deleteTicket(config, Number(options.ticketId)),
      ),
    );

  ticketGroup
    .command("next")
    .description("Get next ticket")
    .requiredOption("--ticket-id <id>", "Current ticket id")
    .option("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getNextTicket(
          config,
          Number(options.ticketId),
          options.projectId ? Number(options.projectId) : undefined,
        ),
      ),
    );

  ticketGroup
    .command("previous")
    .description("Get previous ticket")
    .requiredOption("--ticket-id <id>", "Current ticket id")
    .option("--project-id <id>", "Project id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getPreviousTicket(
          config,
          Number(options.ticketId),
          options.projectId ? Number(options.projectId) : undefined,
        ),
      ),
    );

  const ticketTeam = ticketGroup
    .command("team")
    .description("Team ticket analytics");

  ticketTeam
    .command("distribution")
    .description("Ticket distribution")
    .requiredOption("--team-id <id>", "Team id")
    .option("--from <iso>", "From date ISO")
    .option("--to <iso>", "To date ISO")
    .option("--range <range>", "Date range shorthand")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamTicketDistribution(config, Number(options.teamId), {
          fromDate: options.from,
          toDate: options.to,
          range: options.range,
        }),
      ),
    );

  ticketTeam
    .command("priority-distribution")
    .description("Priority distribution")
    .requiredOption("--team-id <id>", "Team id")
    .option("--from <iso>", "From date ISO")
    .option("--to <iso>", "To date ISO")
    .option("--range <range>", "Date range shorthand")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamPriorityDistribution(config, Number(options.teamId), {
          fromDate: options.from,
          toDate: options.to,
          range: options.range,
        }),
      ),
    );

  ticketTeam
    .command("statistics")
    .description("Team ticket statistics")
    .requiredOption("--team-id <id>", "Team id")
    .option("--from <iso>", "From date ISO")
    .option("--to <iso>", "To date ISO")
    .option("--range <range>", "Date range shorthand")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamStatistics(config, Number(options.teamId), {
          fromDate: options.from,
          toDate: options.to,
          range: options.range,
        }),
      ),
    );

  withPagination(ticketTeam.command("overdue").description("Overdue tickets"))
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamOverdueTickets(
          config,
          Number(options.teamId),
          buildPagination(options),
        ),
      ),
    );

  ticketTeam
    .command("overdue-count")
    .description("Overdue ticket count")
    .requiredOption("--team-id <id>", "Team id")
    .option("--from <iso>", "From date ISO")
    .option("--to <iso>", "To date ISO")
    .option("--range <range>", "Date range shorthand")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.countTeamOverdueTickets(config, Number(options.teamId), {
          fromDate: options.from,
          toDate: options.to,
          range: options.range,
        }),
      ),
    );

  withPagination(ticketTeam.command("unassigned").description("Unassigned tickets"))
    .requiredOption("--team-id <id>", "Team id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamUnassignedTickets(
          config,
          Number(options.teamId),
          buildPagination(options),
        ),
      ),
    );

  ticketTeam
    .command("creation-series")
    .description("Ticket creation time series")
    .requiredOption("--team-id <id>", "Team id")
    .option("--days <days>", "Number of days", "7")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTeamTicketCreationSeries(
          config,
          Number(options.teamId),
          Number(options.days),
        ),
      ),
    );

  const ticketUser = ticketGroup
    .command("user")
    .description("User ticket analytics");

  withPagination(ticketUser.command("overdue").description("User overdue tickets"))
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getUserOverdueTickets(
          config,
          Number(options.userId),
          buildPagination(options),
        ),
      ),
    );

  ticketUser
    .command("team-priority-distribution")
    .description("Team priority distribution by user")
    .requiredOption("--user-id <id>", "User id")
    .option("--from <iso>", "From date ISO")
    .option("--to <iso>", "To date ISO")
    .option("--range <range>", "Date range shorthand")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getUserTeamPriorityDistribution(config, Number(options.userId), {
          from: options.from,
          to: options.to,
          range: options.range,
        }),
      ),
    );

  ticketGroup
    .command("state-history")
    .description("Ticket state history")
    .requiredOption("--ticket-id <id>", "Ticket id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.getTicketStateHistory(config, Number(options.ticketId)),
      ),
    );

  ticketGroup
    .command("update-state")
    .description("Update ticket state")
    .requiredOption("--ticket-id <id>", "Ticket id")
    .requiredOption("--new-state-id <id>", "New state id")
    .action(
      actionWithConfig(program, (config, options) =>
        tickets.updateTicketState(
          config,
          Number(options.ticketId),
          Number(options.newStateId),
        ),
      ),
    );

  const reportGroup = program
    .command("report")
    .description("Reports");

  reportGroup
    .command("ticket-ageing")
    .description("Ticket ageing report")
    .requiredOption("--project-id <id>", "Project id")
    .option("--iteration-id <id>", "Iteration id")
    .option("--status <status>", "Status (repeatable)", collectValues, [])
    .option("--priority <priority>", "Priority (repeatable)", collectValues, [])
    .option("--assign-user-id <id>", "Assign user id (repeatable)", collectValues, [])
    .option("--created-from <date>", "Created from yyyy-MM-dd")
    .option("--created-to <date>", "Created to yyyy-MM-dd")
    .option("--group-by <value>", "Group by")
    .option("--include-closed", "Include closed", false)
    .action(
      actionWithConfig(program, (config, options) =>
        reports.getTicketAgeingReport(config, {
          projectId: options.projectId,
          iterationId: options.iterationId,
          status: options.status?.length ? options.status : undefined,
          priority: options.priority?.length ? options.priority : undefined,
          assignUserId: options.assignUserId?.length ? options.assignUserId : undefined,
          createdFrom: options.createdFrom,
          createdTo: options.createdTo,
          groupBy: options.groupBy,
          includeClosed: Boolean(options.includeClosed),
        }),
      ),
    );

  const commentGroup = program
    .command("comment")
    .description("Comments");

  commentGroup
    .command("save")
    .description("Create or update comment")
    .requiredOption("--json <json>", "Comment JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        comments.saveComment(config, parseJsonOption(options, "json", "Comment JSON")),
      ),
    );

  commentGroup
    .command("get")
    .description("Get comment")
    .requiredOption("--comment-id <id>", "Comment id")
    .action(
      actionWithConfig(program, (config, options) =>
        comments.getComment(config, Number(options.commentId)),
      ),
    );

  commentGroup
    .command("list")
    .description("List comments for entity")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .action(
      actionWithConfig(program, (config, options) =>
        comments.listComments(
          config,
          options.entityType,
          Number(options.entityId),
        ),
      ),
    );

  commentGroup
    .command("delete")
    .description("Delete comment")
    .requiredOption("--comment-id <id>", "Comment id")
    .action(
      actionWithConfig(program, (config, options) =>
        comments.deleteComment(config, Number(options.commentId)),
      ),
    );

  const notificationGroup = program
    .command("notification")
    .description("Notifications");

  withPagination(notificationGroup.command("list").description("List notifications"))
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        notifications.listNotifications(
          config,
          Number(options.userId),
          buildPagination(options),
        ),
      ),
    );

  notificationGroup
    .command("mark-read")
    .description("Mark notifications as read")
    .requiredOption("--notification-ids <ids>", "Comma-separated notification ids")
    .action(
      actionWithConfig(program, (config, options) =>
        notifications.markNotificationsRead(
          config,
          parseNumberList(options.notificationIds),
        ),
      ),
    );

  notificationGroup
    .command("unread")
    .description("List unread notifications")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        notifications.listUnreadNotifications(config, Number(options.userId)),
      ),
    );

  const activityGroup = program
    .command("activity")
    .description("Activity logs");

  withPagination(activityGroup.command("list").description("List activity logs"))
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .action(
      actionWithConfig(program, (config, options) =>
        activity.listActivityLogs(
          config,
          options.entityType,
          Number(options.entityId),
          buildPagination(options),
        ),
      ),
    );

  withPagination(activityGroup.command("user").description("List user activity logs"))
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        activity.listUserActivityLogs(
          config,
          Number(options.userId),
          buildPagination(options),
        ),
      ),
    );

  const watcherGroup = program
    .command("watcher")
    .description("Watchers");

  watcherGroup
    .command("add")
    .description("Add watchers to entity")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .requiredOption("--user-ids <ids>", "Comma-separated user ids")
    .action(
      actionWithConfig(program, (config, options) =>
        watchers.addWatchers(
          config,
          options.entityType,
          Number(options.entityId),
          parseNumberList(options.userIds),
        ),
      ),
    );

  watcherGroup
    .command("remove")
    .description("Remove watchers from entity")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .requiredOption("--user-ids <ids>", "Comma-separated user ids")
    .action(
      actionWithConfig(program, (config, options) =>
        watchers.removeWatchers(
          config,
          options.entityType,
          Number(options.entityId),
          parseNumberList(options.userIds),
        ),
      ),
    );

  watcherGroup
    .command("remove-one")
    .description("Remove single watcher")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        watchers.removeWatcher(
          config,
          options.entityType,
          Number(options.entityId),
          Number(options.userId),
        ),
      ),
    );

  watcherGroup
    .command("list")
    .description("List entity watchers")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .action(
      actionWithConfig(program, (config, options) =>
        watchers.listWatchers(
          config,
          options.entityType,
          Number(options.entityId),
        ),
      ),
    );

  withPagination(watcherGroup.command("user").description("List watched entities"))
    .requiredOption("--user-id <id>", "User id")
    .action(
      actionWithConfig(program, (config, options) =>
        watchers.listWatchedEntities(
          config,
          Number(options.userId),
          buildPagination(options),
        ),
      ),
    );

  const settingGroup = program
    .command("setting")
    .description("Application settings");

  settingGroup
    .command("get")
    .description("Get setting by key")
    .requiredOption("--key <key>", "Setting key")
    .action(
      actionWithConfig(program, (config, options) =>
        appSettings.getSetting(config, options.key),
      ),
    );

  settingGroup
    .command("list")
    .description("List settings")
    .option("--group <group>", "Group filter")
    .action(
      actionWithConfig(program, (config, options) =>
        appSettings.listSettings(config, options.group),
      ),
    );

  settingGroup
    .command("update")
    .description("Update settings")
    .requiredOption("--json <json>", "Settings JSON array")
    .action(
      actionWithConfig(program, (config, options) =>
        appSettings.updateSettings(
          config,
          parseJsonOption(options, "json", "Settings JSON"),
        ),
      ),
    );

  settingGroup
    .command("update-key")
    .description("Update setting by key")
    .requiredOption("--key <key>", "Setting key")
    .requiredOption("--json <json>", "Setting JSON")
    .action(
      actionWithConfig(program, (config, options) =>
        appSettings.updateSetting(
          config,
          options.key,
          parseJsonOption(options, "json", "Setting JSON"),
        ),
      ),
    );

  const fileGroup = program.command("file").description("File operations");

  fileGroup
    .command("upload")
    .description("Upload a file")
    .requiredOption("--path <path>", "File path")
    .requiredOption("--type <type>", "Storage type")
    .option("--parent-path <path>", "Parent path")
    .action(
      actionWithConfig(program, (config, options) =>
        files.uploadFile(config, options.path, options.type, options.parentPath),
      ),
    );

  fileGroup
    .command("attach")
    .description("Upload entity attachments")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .requiredOption("--files <paths>", "Comma-separated file paths")
    .action(
      actionWithConfig(program, (config, options) =>
        files.uploadEntityAttachments(
          config,
          options.entityType,
          Number(options.entityId),
          options.files.split(",").map((value: string) => value.trim()).filter(Boolean),
        ),
      ),
    );

  fileGroup
    .command("attachments")
    .description("List entity attachments")
    .requiredOption("--entity-type <type>", "Entity type")
    .requiredOption("--entity-id <id>", "Entity id")
    .action(
      actionWithConfig(program, (config, options) =>
        files.listEntityAttachments(
          config,
          options.entityType,
          Number(options.entityId),
        ),
      ),
    );

  fileGroup
    .command("delete-attachment")
    .description("Delete attachment")
    .requiredOption("--attachment-id <id>", "Attachment id")
    .action(
      actionWithConfig(program, (config, options) =>
        files.deleteAttachment(config, Number(options.attachmentId)),
      ),
    );

  fileGroup
    .command("download")
    .description("Download file")
    .requiredOption("--remote-path <path>", "Remote path under /api/files")
    .requiredOption("--out <path>", "Output file path")
    .action(
      actionWithConfig(
        program,
        (config, options) =>
          files.downloadFile(config, options.remotePath, options.out),
        { print: false },
      ),
    );

  const timezoneGroup = program
    .command("timezone")
    .description("Timezone data");

  timezoneGroup
    .command("list")
    .description("List timezones")
    .action(actionWithConfig(program, (config) => shared.listTimezones(config)));

  const versionGroup = program.command("version").description("Version info");

  versionGroup
    .command("get")
    .description("Get current version")
    .action(actionWithConfig(program, (config) => shared.getVersion(config)));

  versionGroup
    .command("check")
    .description("Check latest version")
    .action(actionWithConfig(program, (config) => shared.checkVersion(config)));

  const aiGroup = program.command("ai").description("AI helpers");

  aiGroup
    .command("summary")
    .description("Summarize ticket description")
    .requiredOption("--text <text>", "Ticket description text")
    .action(
      actionWithConfig(program, (config, options) =>
        shared.aiSummary(config, options.text),
      ),
    );

  const sseGroup = program.command("sse").description("Server-sent events");

  sseGroup
    .command("listen")
    .description("Listen for SSE events")
    .requiredOption("--user-id <id>", "User id")
    .option("--token <token>", "JWT token (defaults to env)")
    .action(
      actionWithConfig(
        program,
        async (config, options) => {
          const token = options.token || config.token;
          if (!token) {
            throw new Error("Token is required for SSE. Set FLOWINQUIRY_TOKEN or --token.");
          }
          await streamSse(`/sse/events/${options.userId}`, { ...config, token }, {
            query: { token },
            onMessage: (data) => {
              process.stdout.write(`${data}\n`);
            },
          });
        },
        { print: false, config: { requireToken: false } },
      ),
    );

  return program;
}
