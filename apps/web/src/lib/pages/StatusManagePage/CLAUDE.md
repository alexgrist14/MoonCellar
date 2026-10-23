# StatusManagePage

Where admins add projects to the status hub, change their blocks, issue upload tokens and delete
projects. The page is a heading plus `widgets/status/ProjectsManager`.

## Routes

- `/manage` on the status host — `src/app/status/(gated)/manage/page.tsx`, inside the gated layout.
  `manage` is in `RESERVED_PROJECT_SLUGS`, so no project can take the address.

## Data

- `ProjectsManager` runs `useProjectsQuery` and the project mutations of `entities/project/api`.

## Composition

1. `Box` → `SectionTitle as="h1"` "Manage projects".
2. `ProjectsManager`: the token notice (after a create or a new token), the "New project" form, and
   the projects `Table` (row → edit modal; "New token" and "Delete" behind `ConfirmModal`).

## Rules and gotchas

- **A token is shown once, in the answer of the create or rotate request.** The API keeps only its
  sha256; closing the notice loses it, and the fix is another "New token".
- Turning a block off in the edit modal deletes that block's upload on the API.
