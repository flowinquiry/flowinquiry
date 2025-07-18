<div style="display: flex; justify-content: center; align-items: center;">
  <a href="https://flowinquiry.io" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg" type="image/svg+xml">
      <img alt="FlowInquiry Logo" src="assets/logo-light.svg"/>
    </picture>
  </a>
</div>

<p align="center">
  <a href="https://flowinquiry.io"><strong>Main page</strong></a> |
  <a href="https://docs.flowinquiry.io"><strong>Explore the docs »</strong></a> |
  <a href="https://github.com/orgs/flowinquiry/projects/4/views/3"><strong>Backlogs</strong></a> |
  <a href="https://hub.docker.com/u/flowinquiry"><strong>Docker</strong></a>
</p>

[![Build Status](https://github.com/flowinquiry/flowinquiry/actions/workflows/ci.yml/badge.svg)](https://github.com/flowinquiry/flowinquiry/actions/workflows/ci.yml)
[![Contributors](https://img.shields.io/github/contributors/flowinquiry/flowinquiry.svg)](https://github.com/flowinquiry/flowinquiry/graphs/contributors)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/69704fb598fa40b5b053916ba4272797)](https://app.codacy.com/gh/flowinquiry/flowinquiry/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![GitHub release; latest by date](https://img.shields.io/github/v/release/flowinquiry/flowinquiry)](https://github.com/flowinquiry/flowinquiry/releases)
[![Frontend Docker Pulls](https://img.shields.io/docker/pulls/flowinquiry/flowinquiry-frontend?label=frontend%20pulls&logo=docker)](https://hub.docker.com/r/flowinquiry/flowinquiry-frontend)
[![Backend Docker Pulls](https://img.shields.io/docker/pulls/flowinquiry/flowinquiry-server?label=backend%20pulls&logo=docker)](https://hub.docker.com/r/flowinquiry/flowinquiry-server)
[![GitHub stars](https://img.shields.io/github/stars/flowinquiry/flowinquiry-server.svg?style=social)](https://github.com/flowinquiry/flowinquiry-server/stargazers)
![License](https://img.shields.io/badge/License-AGPLv3-blue)

> ⭐ **If you find FlowInquiry useful, please consider giving us a star on [GitHub](https://github.com/flowinquiry/flowinquiry)!**. It motivates us a lot and helps the project grow!

## What is FlowInquiry

FlowInquiry is a free, open-source tool for managing projects, tickets, and requests. It helps teams track work, set clear steps, and meet deadlines. You can define workflows, set SLAs, and keep all updates in one place. FlowInquiry is built to be simple, reliable, and easy to adapt to your team’s process.

![FlowInquiry](assets/flowinquiry_slide.webp)

## ⚙️ Key Features of FlowInquiry

* 📂 Projects – Use a Kanban board to group tasks by iteration or epic

* 🧩 Custom Workflows – Set request states and define how they move

* ⏱ SLA Tracking – Set due dates and handle items that run late

* 🔄 Live Updates – See changes in teams, projects, or requests as they happen

* 👥 Comments and Watchers – Share updates and keep the right people informed

* 📅 Timeline View – See the full history of a request at a glance

* 🧵 Change Log – Track what changed, when, and by whom

* 🔐 Role-Based Access – Control who can see or do what

* 🌍 Language Support – Use in multiple languages for global teams

* 🔌 Integrations – Connect with email, with Slack and GitHub coming soon

* 🚀 Deployment Options – Run with Docker or on your own setup; Kubernetes coming soon

## Built With

<div style="display: flex; justify-content: left; gap: 20px; align-items: center;">
    <img src="assets/spring-boot.svg" alt="Spring Boot" width="80" height="80" title="Acts as the backbone of the back-end, orchestrating various components. It handles the creation and management of REST APIs, service layers, and controllers to facilitate business logic. Spring Boot also integrates seamlessly with the database through JPA and Hibernate and provides hooks for adding essential services like logging, tracing, and monitoring to ensure a well-rounded and maintainable application architecture">
    <img src="assets/hibernate.svg" alt="Hibernate" width="80" height="80" title="Serves as the ORM (Object-Relational Mapping) framework, facilitating seamless interaction between Java objects and the database">
    <img src="assets/postgresql.svg" alt="PostgreSQL" width="80" height="80" title="Acts as the primary relational database, offering reliability, scalability, and robust support for complex queries">
    <img src="assets/liquibase.svg" alt="Liquibase" width="80" height="80" title="Manages database schema changes through version-controlled migration scripts, ensuring consistency across environments">
    <img src="assets/docker.svg" alt="Docker" width="80" height="80" title="Provides containerization for consistent application deployment across environments, enabling scalability and portability">
    <img src="assets/nextjs.svg" alt="Docker" width="80" height="80" title="Used as the primary framework to structure the application, managing routing and integrating client-side rendering powered by React.js. Next.js facilitates seamless communication with the FlowInquiry back-end via REST APIs, ensuring a smooth data exchange and interactive user experience">
    <img src="assets/tailwind-css.svg" alt="Tailwind Css" width="80" height="80" title="Used in combination with ShadCN and FlowInquiry's custom components to deliver flexible layouts and customizable themes">
    <img src="assets/shadcn-ui.svg" alt="Shadcn" width="80" height="80" title="Serves as the foundation of the FlowInquiry UI, providing a consistent and accessible design system. All FlowInquiry components are built on top of ShadCN, ensuring a cohesive and extensible user interface across the application">
</div>

## Getting Started

FlowInquiry uses a [monorepo](https://monorepo.tools/) structure to manage all parts of the application — including the backend, frontend, and documentation — in a single repository. This approach ensures consistency, shared tooling, and easier cross-service collaboration.

All core services are located in the apps/ directory:

* apps:
  * backend: The Spring Boot service that powers the API layer, business logic, database integrations, workflows, and backend features of FlowInquiry.
  * frontend: The Next.js web application that provides the user interface for the platform. It integrates with the backend via REST APIs, handles authentication, and supports both freemium and premium features through dynamic configuration.
  * ops: the central repository that provides artifacts and configuration files to help customers deploy FlowInquiry using Docker, Kubernetes, and other environments.
  * docs: A documentation site built with a [Nextra](https://nextra.site/) static site generator, providing guides, and setup instructions for developers and users.

To get started with setting up the frontend and backend locally, follow the official developer guides:

* [Frontend Setup Guide](https://docs.flowinquiry.io/developer_guides/frontend/getting_started)

* [Backend Setup Guide](https://docs.flowinquiry.io/developer_guides/backend/getting_started)

* [Documentation Setup Guide](https://docs.flowinquiry.io/developer_guides/documentation)

These guides provide step-by-step instructions to help you configure your environment, install dependencies, and run the services in development mode.

## 🚀 Quick Launch

Have Docker installed? Get FlowInquiry running in seconds!

```
# Using wget
wget -O install-flowinquiry.sh https://raw.githubusercontent.com/flowinquiry/flowinquiry/refs/heads/main/apps/ops/flowinquiry-docker/scripts/install-flowinquiry.sh && chmod +x install-flowinquiry.sh && ./install-flowinquiry.sh

# Or using curl
curl -sSL https://raw.githubusercontent.com/flowinquiry/flowinquiry/refs/heads/main/apps/ops/flowinquiry-docker/scripts/install-flowinquiry.sh -o install-flowinquiry.sh && chmod +x install-flowinquiry.sh && ./install-flowinquiry.sh
```
This will:

* Download the necessary setup scripts directly from FlowInquiry's GitHub repository

* Prompt you for basic inputs (such as whether to enable SSL)

* Automatically configure and launch FlowInquiry

### 🖥️ Example Console Output After Installation

After running the installation script, you will see output similar to the following:

```bash
➜  flowinquiry-docker git:(main) ✗ install-flowinquiry.sh
🔍 Checking Docker installation...
✅ Docker and Docker Compose are properly installed and running.
📥 Checking installation directory...
✅ $USER-HOME/flowinquiry-docker already exists, preserving existing files.
🗑️ Cleaning up scripts directory...
📥 Downloading necessary files...
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/scripts/all.sh using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/scripts/shared.sh using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/scripts/backend-env.sh using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/scripts/frontend-env.sh using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/Caddyfile_http using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/Caddyfile_https using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/services_http.yml using curl
✅ File successfully downloaded to $USER-HOME/flowinquiry-docker/services_https.yml using curl
🔧 Making scripts executable...
🚀 Running setup scripts...
frontend-env.sh succeeded.
🔒 SSL Configuration
SSL is recommended when installing FlowInquiry for production use or when accessing from anywhere.
For local testing purposes, you may not need SSL.
Do you want to set up FlowInquiry with SSL? (y/n): n
⚠️ Setting up without SSL (HTTP only)
🐳 Starting services with Docker Compose...
Using host IP address: 192.168.0.78
Your service will be available at: http://192.168.0.78:1234
Using host IP address: 192.168.0.78
[+] Running 4/4
 ✔ Container flowinquiry-front-end-1                                                                                                                       Recreated                                                                                                                                                                                                                                                                                                      0.0s
 ✔ Container flowinquiry-back-end-1                                                                                                                        Recreated                                                                                                                                                                                                                                                                                                      0.1s
 ✔ Container flowinquiry-postgresql-1                                                                                                                      Recreated                                                                                                                                                                                                                                                                                                      0.0s
 ! back-end The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested                                                                                                                                                                                                                                                                                                                0.0s
Attaching to back-end-1, front-end-1, postgresql-1
back-end-1    | The application will start in 0s...
front-end-1   |    ▲ Next.js 15.3.1
front-end-1   |    - Local:        http://localhost:3000
front-end-1   |    - Network:      http://0.0.0.0:3000
front-end-1   |
front-end-1   |  ✓ Starting...
front-end-1   |  ✓ Ready in 34ms

back-end-1    |   INFO 1 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logApplicationStartup:120 : ----------------------------------------------------------
back-end-1    |   INFO 1 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logApplicationStartup:121 :        Application 'FlowInquiry' is running! Access URLs:
back-end-1    |   INFO 1 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logApplicationStartup:122 :        Local:          http://localhost:8080/
back-end-1    |   INFO 1 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logApplicationStartup:123 :        External:       http://172.18.0.4:8080/
back-end-1    |   INFO 1 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logApplicationStartup:124 :        Profile(s):     prod
```

### 🌐 Accessing FlowInquiry
1. Open your browser and go to: `http://<LAN_IP>:1234`

2. Find your LAN IP address in the installation logs. Look for a message like:
```
Using host IP address: 192.168.0.78
```

3. Log in with the default administrator credentials:
- **Username:** `admin@flowinquiry.io`
- **Password:** `admin`

➡️ For **testing purposes**, it is safe to select **`n`** (no SSL) and run FlowInquiry over plain HTTP within your local network.  
➡️ For **production deployments**, it is strongly recommended to select **`y`** and configure SSL for secure access.


> FlowInquiry also supports a manual installation process, allowing you to run each step individually if you prefer to understand what happens at each stage. [Learn more in the step-by-step guide](https://docs.flowinquiry.io/user_guides/setup/basic_installation#2-manual-step-by-step-installation)

## License
This project is licensed under the [AGPLv3](LICENSE) License.

## How to Contribute

We welcome contributions of all kinds — not just code!

You can:
- Star the project ⭐
- Share it on social media 📢
- Create a tutorial or video 🎥
- Report bugs or suggest improvements 🐛
- Submit a pull request 🛠️
  Help with Localization 🌍 – [Contribute a Translation](https://docs.flowinquiry.io/how_to_contributes/localization)

Read the full guide: [How to Contribute to FlowInquiry](https://docs.flowinquiry.io/how_to_contributes/your_action_is_meaningful_to_us)


## 💪 Contributors

Thanks to all the contributors! 🙌  

[![Contributors](https://contrib.rocks/image?repo=flowinquiry/flowinquiry-server)](https://github.com/flowinquiry/flowinquiry-server/graphs/contributors)