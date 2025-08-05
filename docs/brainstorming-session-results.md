# Brainstorming Session Results

## Executive Summary

*   **Session Topic:** Full-stack refactor and feature definition for an enterprise-ready, AI-powered ecological report generator website.
*   **Session Goal:** Broad exploration of features, user needs, and technical constraints to define a clear MVP scope.
*   **Techniques Used:** Progressive Flow, including "What If" Scenarios, Reversal/Inversion, and Mind Mapping/Categorization.
*   **Key Themes Identified:** Core AI & Generation Engine, User Experience & Workflow, Document Output & Interactivity, Trust, Security & Validation, and a future Ecology Toolbox.

---

## 1. Core AI & Generation Engine

### Ideas Generated:
*   Utilize multiple AI providers (Claude, Gemini, OpenAI, DeepSeek) that support JSON output.
*   Implement dual generation modes: a "Fast" mode for quick drafts and a "Slow" mode for more deliberative, in-depth analysis.
*   **[MVP]** The core feature will be the AI's ability to interpret uploaded GIS shapefiles, generate corresponding map images, and write descriptive text analyzing the map data within the report.

---

## 2. User Experience & Workflow

### Ideas Generated:
*   **[MVP]** The primary user workflow will be built around modular, section-by-section regeneration. This avoids the frustration of full re-writes and allows for iterative refinement. The system must intelligently track dependencies (e.g., auto-updating a summary if a core section changes).
*   **[MVP]** The user interface must be clean, modern, and intuitive, specifically designed for ecologists who may not be tech-savvy. Advanced settings will be available but hidden by default to avoid clutter.
*   **[MVP]** A clear, easy-to-use file explorer is essential for managing reports. It must clearly indicate the status of reports, including those currently "in generation."
*   User accounts will have settings for custom defaults (generation settings, light/dark mode), password changes, and subscription management.

---

## 3. Document Output & Interactivity

### Ideas Generated:
*   The final output must be a DOCX file. The system should support uploading a custom DOCX template (with pre-set headers/footers) into which the AI-generated content is injected.
*   The application will feature a rich, interactive online report viewer.
*   A "hybrid document" model will be used: the exported DOCX will contain high-resolution static images (like maps) with embedded hyperlinks or QR codes that link back to the interactive version in the web app.

---

## 4. Trust, Security & Validation

### Ideas Generated:
*   **[MVP]** A robust, automated data redaction step is critical. Private or sensitive information must be stripped from user-uploaded content *before* it is sent to any external AI model.
*   **[MVP]** A post-generation validation step must be implemented. This is a crucial safety net to ensure the AI's output is factually accurate and reliable, preventing content "hallucinations."
*   All client data must be stored in Australia to comply with data residency requirements.
*   Access to the interactive online reports will be secured, limited to users with a specific link or those explicitly granted permission on an account list.

---

## 5. Ecology Toolbox

### Ideas Generated:
*   This category is reserved for future tools that could add value for ecologists but are outside the scope of the core report generator (e.g., standalone PDF table extractors for different report types).

---

## Action Plan: 2-Month MVP

Based on our synthesis, the following features have been prioritized for the initial 2-month development sprint.

### **Top 3 Priority Areas:**

1.  **The Generator Core:** Build the agentic system that can take uploaded files (including shapefiles), use an AI model to generate text and a map image for a specific report section, and place it in a document.
2.  **The User Workflow:** Design and implement the core UI for uploading files, triggering generation, viewing the report, and managing files. Crucially, this includes the ability to re-generate a single section.
3.  **The Trust Layer:** Implement the initial versions of the data redaction and post-generation validation steps. These are non-negotiable for user trust, even in an MVP.

### **Post-MVP (v1.1) Feature Pipeline:**

*   Integration of multiple AI models.
*   "Fast" vs "Slow" generation modes.
*   Custom DOCX template uploads.
*   Secure sharing links for interactive reports.
*   Full user account and subscription settings.
