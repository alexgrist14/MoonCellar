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
2. `ProjectsManager`: the "New project" form and the projects `Table` (row → edit modal; the token
   count opens `ProjectTokens`; "Delete" behind `ConfirmModal`).
3. `ProjectTokens` (a modal): every token of the project with its name, when it was added and when it
   last uploaded, "Revoke" (asks "Sure?" in place), and "Add token" by name, which shows the new token
   once.

## Rules and gotchas

- **A project has one token per machine or CI.** Creating a project issues none; the usual way to get
  one is the connect flow (`StatusConnectPage`), which names it after the device. Revoking stops only
  that machine.
- **A token is shown once, in the answer that created it.** The API keeps only its sha256; closing the
  modal loses it, and the fix is another token.
- **`ProjectTokens` reads its project from `useProjectsQuery` by slug, never from props:** `modal.open`
  keeps the JSX it was given, so a project passed in would not show a token just added or revoked.
- Turning a block off in the edit modal deletes that block's upload on the API.
