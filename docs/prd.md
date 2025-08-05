# AI Ecological Report Generator Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals
*   To significantly reduce the time and manual effort required for ecologists to produce high-quality, scientifically sound assessment reports.
*   To create a centralized, secure, and user-friendly platform that becomes the indispensable "IDE for Ecologists."
*   To validate the core product value by successfully launching an MVP within 2-4 months and onboarding an initial cohort of beta testers.
*   To establish a strong foundation for a commercially viable product that can be expanded across Australia.

### Background Context
This project addresses a major inefficiency in the ecological consulting industry. Consultants currently rely on a fragmented and manual workflow, juggling disparate tools for data analysis, report writing, and document formatting. This process is not only slow and costly but also prone to human error, which can carry significant legal and scientific risks.

Existing tools are inadequate. Generic word processors lack data integration, public AI chatbots are not secure or specialized enough, and GIS software is disconnected from the report creation process. This PRD outlines the requirements for a new, integrated solution that bridges these gaps. We will build a purpose-built, agentic AI system that uses a client's own data to automate the drafting of complex reports, starting with a focused MVP that proves the core value of this novel approach.

### Change Log
| Date       | Version | Description                                          | Author     |
| :--------- | :------ | :--------------------------------------------------- | :--------- |
| 2024-05-22 | 0.1     | Initial draft of PRD based on approved Project Brief. | John (PM)  |

## 2. Requirements (Revised)

### Functional Requirements
*   **FR1:** The system shall allow users to create and manage distinct projects, each serving as a container for reports and their associated data files.
*   **FR2:** Within a project, the system shall allow users to upload source files, including but not limited to GIS shapefiles, PDFs, and text documents.
*   **FR3:** The system shall process an uploaded GIS shapefile to generate a static map image and a corresponding text analysis for a designated report section.
*   **FR4:** The system shall provide a mechanism for users to initiate the AI-powered generation of a report, which can be done for the entire document or for individual, modular sections.
*   **FR5:** The system shall present the generated report content within a clean, intuitive web interface that clearly delineates the different report sections.
*   **FR6:** The system shall implement a data redaction service that automatically identifies and removes sensitive, personally identifiable information from user data *before* it is transmitted to any third-party AI model.
*   **FR7:** The system shall include a post-generation validation step in the workflow, allowing the user to review and approve the AI-generated content for accuracy.
*   **FR8:** The system shall provide a secure, read-only "Debug & Support" admin panel.
*   **FR9:** Within the admin panel, an administrator shall be able to search for a user by email and view a list of their generated reports.
*   **FR10:** Within the admin panel, an administrator shall be able to view the final generated content and the detailed, step-by-step logs for a specific report generation process.
*   **FR11:** When a generation task completes, if the AI agent encountered significant ambiguity in the source documents, the system shall present the user with a list of clarifying questions alongside the generated draft. The user shall have a mechanism to provide answers to these questions and re-initiate the generation for that section using the new information.

### Non-Functional Requirements
*   **NFR1:** The user interface shall be clean, intuitive, and designed for users who are not technology experts. Advanced features and settings must be hidden by default (progressive disclosure).
*   **NFR2:** The application shall be a desktop-first responsive web application, ensuring a primary experience on desktop and a functional progress-tracking view on mobile devices.
*   **NFR3:** The application's backend architecture shall be serverless, utilizing Vercel Functions or Google Cloud Functions to handle the agentic workflow.
*   **NFR4:** All user data and cloud infrastructure must be located and operate within the `australia-southeast1` (Sydney) Google Cloud Platform region to ensure data residency.
*   **NFR5:** The system must use a robust queueing mechanism (e.g., Google Cloud Tasks) to reliably manage the long-running (5-20 minute) report generation jobs, ensuring the UI remains responsive throughout.
*   **NFR6:** The system shall maintain a generation success rate of over 98% for all initiated report generation tasks.
