# Epic 1.4: Project File Management & Document Upload

## Epic Information
- **Epic Number**: 1.4
- **Title**: Project File Management & Document Upload
- **Status**: To Do
- **Owner**: @pm

## Goal
To allow users to upload, view, and manage the source documents (e.g., PDFs, spreadsheets, images) associated with a specific ecological project. This is the foundational step for enabling data extraction and report generation.

## Description
Currently, users can create, edit, and manage project metadata. However, the core of the application—analyzing ecological data—requires the source documents to be associated with a project. This epic covers the end-to-end functionality of uploading these documents.

This involves creating a user-friendly interface for file uploads on the project details page, building the backend infrastructure to handle file storage securely and efficiently, and updating the data model to link files to their respective projects in Firestore.

## Stories
- **Story 1.5: Implement File Upload UI**: Integrate a file dropzone into the Project Details page, allowing users to select and upload one or more files. This includes visual feedback for upload progress, success, and errors.
- **Story 1.6: Handle File Storage & Linking**: Create the backend logic (Firebase Function) to securely receive uploaded files, store them in a dedicated Cloud Storage bucket, and create corresponding metadata documents in a `files` sub-collection within the project document in Firestore.
- **Story 1.7: Display and Manage Uploaded Files**: Create a UI component on the Project Details page to list all uploaded files. The list should display key information like filename, file type, and upload date, and provide options for users to view (download) or delete a file.

## Business Value
- **Enables Core Functionality**: This is a critical prerequisite for the main value proposition of the application—automated data extraction and report generation.
- **Centralized Data Management**: Provides a single, organized location for all source materials related to an ecological assessment, improving consultant workflow.
- **Scalability**: Establishes the architectural pattern for handling file-based data, which can be extended for other data types in the future.
