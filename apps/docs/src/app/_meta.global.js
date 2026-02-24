export default {
  index: {
    title: "Introduction",
    type: "page",
    display: "hidden",
  },
  user_guides: {
    type: "page",
    title: "User Guides",
    items: {
      introduction: "Introduction",
      setup: {
        title: "Setup Overview",
        items: {
          basic_installation: "Basic Installation",
        },
      },
      getting_started: "Get started",
      workflow_management: "Workflow management",
      working_with_requests: "Working with requests",
      project_management: "Project management",
      administrator: {
        title: "Administrator",
        items: {
          smtp_server: "Email Setup Guide (SMTP Configuration)",
          upgrade: "Upgrade",
        },
      },
    },
  },
  developer_guides: {
    type: "page",
    title: "Developer Guides",
    items: {
      index: "Programming languages and development tools",
      frontend: {
        title: "Frontend",
        items: {
          getting_started: "Get started",
          project_structure: "Project Structure",
          playwright_testing: "Playwright Testing Guide",
        },
      },
      backend: {
        title: "Backend",
        items: {
          getting_started: "Getting-started",
          high_level_architect: "High-level architect",
          data_layer: "Data Layer",
          dynamic_query_parameters: "Using Dynamic Query Parameters",
          scheduler: "Scheduler",
          database_migration: "Database migration",
          integration_testing: "Integration Testing",
          api_docs: "API-Docs",
        },
      },
      deployment: {
        title: "Deployment",
        items: {
          build_docker_image: "Build FlowInquiry Docker Images (Optional)",
        },
      },
      documentation: "Documentation",
    },
  },
  how_to_contributes: {
    title: "How to Contribute",
    type: "page",
    items: {
      your_action_is_meaningful_to_us: "Your Action Is Meaningful to Us",
      your_first_pr: "Your first PR",
      localization: "Localization",
    },
  },
  about: {
    type: "page",
    title: "About",
  },
};
