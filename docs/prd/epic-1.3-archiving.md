# Epic 1.3: Project Archiving and Restoration

## Epic Goal
To provide users with the ability to both archive and restore projects, allowing them to manage their workspace by hiding completed or inactive projects and retrieving them later if needed.

## Epic Description

**Existing System Context:**
- **Current Functionality:** Users can currently *archive* an active project from the project details page. This is a one-way action. The dashboard allows filtering to view 'Active' or 'Archived' projects.
- **Technology Stack:** Next.js, React, Zustand for state management, Firebase/Firestore.
- **Integration Points:** The project details page (`/projects/[id]`), the Zustand store (`project-management.ts`), and the existing `archiveProject` Firebase Function. A new `unarchiveProject` function and corresponding store action will be needed.

**Enhancement Details:**
- **What's being added/changed:**
  1.  An "Unarchive" or "Restore" button will be added to the project details page when viewing an archived project.
  2.  A new `unarchiveProject` action will be created in the `project-management` Zustand store.
  3.  This action will call a backend endpoint (or an existing one with a new parameter) to change the project's status from `archived` back to `active`.
- **How it integrates:** This is a direct enhancement of the existing status management system. It makes the archiving feature a two-way street, providing a more complete workflow for project lifecycle management.
- **Success Criteria:** A user can successfully restore an archived project. The project immediately appears in the 'Active' projects list on the dashboard and functions as a normal project.

## Stories

1.  **Story 1.3.1: Implement Project Restoration UI & Logic** - As a user, I can see and use a button on an archived project's page to restore it, with the change reflected across the app.

## Compatibility Requirements
- [x] Existing APIs can be extended or a new, non-breaking one can be added.
- [x] Database schema changes are backward compatible (no schema changes, just updating the `status` field).
- [x] UI changes follow existing patterns.
- [x] Performance impact is minimal.

## Risk Mitigation
- **Primary Risk:** Low. The main risk is an inconsistent state if the UI doesn't update correctly after a project is restored.
- **Mitigation:** The risk is low as we are simply toggling a `status` field. The `ProjectManagementStore` already manages state updates, so we will follow the existing pattern of updating the local state after a successful API call and refreshing lists where necessary.
- **Rollback Plan:** Low risk. A rollback would involve a manual data correction in the Firestore database (changing the `status` field back).

## Definition of Done
- [ ] All stories completed with acceptance criteria met.
- [ ] Existing project archiving functionality is verified to ensure no regressions.
- [ ] UI correctly shows "Archive" for active projects and "Restore" for archived projects.
- [ ] The dashboard project list updates correctly when the status filter is changed after a restoration.

## Validation Checklist
**Scope Validation:**
- [x] Epic can be completed in 1-2 stories maximum.
- [x] No new architectural documentation is required.
- [x] Enhancement follows existing patterns.

**Risk Assessment:**
- [x] Risk to the existing system is low.
- [x] Rollback plan is simple and feasible.

**Completeness Check:**
- [x] Epic goal is clear and achievable.
- [x] Stories are properly scoped.
- [x] Success criteria are measurable.
