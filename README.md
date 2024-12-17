# FlowInquiry Server
[![Build Status](https://github.com/flowinquiry/flowinquiry-server/actions/workflows/gradle.yml/badge.svg)](https://github.com/flowinquiry/flowinquiry-server/actions/workflows/gradle.yml)

## Overview
FlowInquiry Server is the back-end component of the FlowInquiry platform, a modern solution for managing workflows and team collaboration. Built with Spring Boot, this server provides a robust and scalable REST API to power the FlowInquiry front-end application and integrates seamlessly with external services.

## Key Features
* **Comprehensive REST API**: Supports the FlowInquiry front-end client with endpoints for managing workflows, teams, requests, and more.
* **External Integrations**: Integrates with third-party services for enhanced functionality and interoperability.
* **Scalable Architecture**: Designed to handle high concurrency and diverse workloads, making it suitable for enterprise use.
* **Secure**: Implements industry-standard security practices, including authentication and role-based access control.

## Getting Started

### Prerequisites
* Java 21 or higher
* Gradle 8 or higher
* PostgreSQL (or compatible database)

### Setup Instructions

#### 1. Clone the repository:
```
   git clone git@github.com:flowinquiry/flowinquiry-server.git
   cd flowinquiry-server
```
#### 2. Configure application parameters

   Set up the application secrets by running the following script:
```bash
scripts/create_secrets.sh
```
This script generates the secrets for the PostgreSQL database and the JWT_BASE64_SECRET, storing them in the local .env.local file.

**Important**: For security reasons, ensure that .env.local is excluded from version control (e.g., by adding it to .gitignore).

#### 3. Build and run application

##### Run the postgres database

FlowInquiry utilizes PostgreSQL as its database and comes with pre-configured PostgreSQL settings. We recommend using Docker as a virtualized container for PostgreSQL. Docker makes it easy to test and run the same PostgreSQL version the FlowInquiry team uses daily, reducing the risk of database compatibility issues.

Ensure Docker is installed on your machine, then start the database by running the following command:
```bash
docker compose -f docker/services.yml up
```

##### Run the server

From the root folder, run the command:
```bash
./gradlew :server:bootRun
```
It may take some time before the server APIs are accessible on the default port 8080
```bash
➜  flowinquiry-server git:(main) ./gradlew :server:bootRun
Starting a Gradle Daemon, 1 incompatible Daemon could not be reused, use --status for details
 
> Task :server:bootRun
 ███████████ ████                                                          █████
░░███░░░░░░█░░███                                                         ░░███
 ░███   █ ░  ░███   ██████  █████ █████ █████ ███ █████  ██████  ████████  ░███ █████
 ░███████    ░███  ███░░███░░███ ░░███ ░░███ ░███░░███  ███░░███░░███░░███ ░███░░███
 ░███░░░█    ░███ ░███████  ░░░█████░   ░███ ░███ ░███ ░███ ░███ ░███ ░░░  ░██████░
 ░███  ░     ░███ ░███░░░    ███░░░███  ░░███████████  ░███ ░███ ░███      ░███░░███
 █████       █████░░██████  █████ █████  ░░████░████   ░░██████  █████     ████ █████
░░░░░       ░░░░░  ░░░░░░  ░░░░░ ░░░░░    ░░░░ ░░░░     ░░░░░░  ░░░░░     ░░░░ ░░░░░
 
 
 
:: FlowInquiry 🤓  :: Running Spring Boot 3.3.1 :: Startup profile(s) dev ::
:: https://www.flowinquiry.io ::
 
2024-10-01T21:51:52.677-07:00 DEBUG 25048 --- [kground-preinit] org.jboss.logging.logProvider:164 : Logging Provider: org.jboss.logging.Slf4jLoggerProvider found via system property 
2024-10-01T21:51:52.708-07:00  INFO 25048 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logStarting:50 : Starting FlowInquiryApp using Java 17.0.11 with PID 25048 (~/Projects/flowinquiry-server/server/build/classes/java/main started by <user> in ~/Projects/flowinquiry-server/server) 
2024-10-01T21:51:52.708-07:00 DEBUG 25048 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logStarting:51 : Running with Spring Boot v3.3.1, Spring v6.1.10 
2024-10-01T21:51:52.708-07:00  INFO 25048 --- [  restartedMain] io.flowinquiry.FlowInquiryApp.logStartupProfileInfo:660 : The following 2 profiles are active: "dev", "api-docs" 
2024-10-01T21:51:52.733-07:00  INFO 25048 --- [  restartedMain] org.springframework.boot.devtools.restart.ChangeableUrls.logTo:252 : The Class-Path manifest attribute in ~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-impl/4.0.5/b70ad3db43ee72d7a35ae3c4d1d6d2e08ce7623/jaxb-impl-4.0.5.jar referenced one or more files that do not exist: file:~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-impl/4.0.5/b70ad3db43ee72d7a35ae3c4d1d6d2e08ce7623/jaxb-core.jar,file:~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-impl/4.0.5/b70ad3db43ee72d7a35ae3c4d1d6d2e08ce7623/angus-activation.jar 
2024-10-01T21:51:52.733-07:00  INFO 25048 --- [  restartedMain] org.springframework.boot.devtools.restart.ChangeableUrls.logTo:252 : The Class-Path manifest attribute in ~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-core/4.0.5/ad427d8777ae2495bfcb37069d611e8379867e6d/jaxb-core-4.0.5.jar referenced one or more files that do not exist: file:~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-core/4.0.5/ad427d8777ae2495bfcb37069d611e8379867e6d/jakarta.activation-api.jar,file:~/.gradle/caches/modules-2/files-2.1/com.sun.xml.bind/jaxb-core/4.0.5/ad427d8777ae2495bfcb37069d611e8379867e6d/jakarta.xml.bind-api.jar 
 
```
## Related Information
- [FlowInquiry document](https://flowinquiry.github.io/flowinquiry-docs): The centralized document for FlowInquiry products
- [FlowInquiry Server](https://github.com/flowinquiry/flowinquiry-server): Back-end services for FlowInquiry.
- [FlowInquiry Client](https://github.com/flowinquiry/flowinquiry-frontend): Front-end application.
- [FlowInquiry Ops](https://github.com/flowinquiry/flowinquiry-ops): Deployment and operational scripts.


## Discussions
For any inquiries about the project, including questions, proposals, or suggestions, please start a new discussion in the [Discussions](https://github.com/flowinquiry/flowinquiry-server/discussions) section. This is the best place to engage with the community and the FlowInquiry team

## License
This project is licensed under the [AGPLv3](LICENSE) License.