"use client";

import { FC, useState } from "react";
import { IProject } from "@mooncellar/schemas";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from "@/src/lib/entities/project/api";
import {
  PROJECT_BLOCK_TITLES,
  getLastUpload,
} from "@/src/lib/entities/project/model";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
import { Table } from "@/src/lib/shared/ui/Table";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { ProjectForm } from "./ProjectForm";
import { ProjectTokens } from "./ProjectTokens";
import styles from "./ProjectsManager.module.scss";

const EDIT_MODAL_ID = "status-project-edit";
const TOKENS_MODAL_ID = "status-project-tokens";
const CONFIRM_MODAL_ID = "status-project-confirm";

const tokensLabel = (count: number) =>
  count === 0 ? "No tokens" : count === 1 ? "1 token" : `${count} tokens`;

export const ProjectsManager: FC = () => {
  const { data: projects = [], isLoading } = useProjectsQuery();
  const [isCreating, setIsCreating] = useState(false);
  const { mutate: create, isPending: isCreatePending } =
    useCreateProjectMutation();
  const { mutateAsync: update } = useUpdateProjectMutation();
  const { mutateAsync: remove } = useDeleteProjectMutation();

  const openEdit = (project: IProject) =>
    modal.open(
      <Box
        title={`Edit ${project.name}`}
        isTitleStart
        onClose={() => modal.close(EDIT_MODAL_ID)}
        wrapperStyle={{ width: "var(--status-edit-modal-width)" }}
      >
        <ProjectForm
          project={project}
          isPending={false}
          submitText="Save"
          onCancel={() => modal.close(EDIT_MODAL_ID)}
          onSubmit={({ name, blocks }) =>
            update({ slug: project.slug, dto: { name, blocks } }).then(() => {
              modal.close(EDIT_MODAL_ID);
              toast.success({ description: `${name} saved` });
            })
          }
        />
      </Box>,
      { id: EDIT_MODAL_ID }
    );

  const openTokens = (slug: string) =>
    modal.open(
      <ProjectTokens
        slug={slug}
        onClose={() => modal.close(TOKENS_MODAL_ID)}
      />,
      { id: TOKENS_MODAL_ID }
    );

  const askRemove = (project: IProject) =>
    modal.open(
      <ConfirmModal
        title="Delete project"
        message={`Delete ${project.name} and everything it uploaded?`}
        warning="Its tokens stop working. A new project with the same address starts empty."
        confirmText="Delete"
        onCancel={() => modal.close(CONFIRM_MODAL_ID)}
        onConfirm={async () => {
          await remove(project.slug);
          modal.close(CONFIRM_MODAL_ID);
          toast.success({ description: `${project.name} deleted` });
        }}
      />,
      { id: CONFIRM_MODAL_ID }
    );

  return (
    <>
      {isCreating && (
        <Box
          title="New project"
          isTitleStart
          onClose={() => setIsCreating(false)}
        >
          <ProjectForm
            isPending={isCreatePending}
            submitText="Create"
            onSubmit={(values) =>
              create(values, {
                onSuccess: (created) => {
                  setIsCreating(false);
                  toast.success({
                    description: `${created.name} created. Connect it from where it uploads, or add a token.`,
                  });
                },
              })
            }
          />
        </Box>
      )}
      <Box
        title="Projects"
        isTitleStart
        titleAction={
          !isCreating && (
            <Button
              color={ButtonColor.ACCENT}
              compact
              onClick={() => setIsCreating(true)}
            >
              <SvgPlus size="16" />
              New project
            </Button>
          )
        }
      >
        <p className={styles.hint}>
          Each machine or CI uploads with its own token. Click a row to rename a
          project or change its blocks.
        </p>
        <Table
          mobileHeadField="project"
          initialSortingKey="project"
          initialSortingOrder="asc"
          isLoading={isLoading}
          rowClickExcludeKeys={["actions"]}
          onRowClick={(index) => openEdit(projects[index])}
          columnStyles={{
            project: { width: "1fr", minWidth: "160px" },
            blocks: { width: "1fr", minWidth: "140px" },
            upload: { width: "150px", minWidth: "120px" },
            actions: { width: "230px", minWidth: "220px" },
          }}
          headers={{
            project: { content: "Project" },
            blocks: { content: "Blocks" },
            upload: { content: "Last upload" },
            actions: { content: "Tokens", isNotSortable: true },
          }}
          rows={projects.map((project) => {
            const upload = getLastUpload(project);
            return {
              project: {
                content: (
                  <span className={styles.project}>
                    <strong>{project.name}</strong>
                    <span className={styles.slug}>{project.slug}</span>
                  </span>
                ),
                sortingValue: project.name,
              },
              blocks: {
                content: project.blocks
                  .map((block) => PROJECT_BLOCK_TITLES[block])
                  .join(", "),
              },
              upload: {
                content: upload
                  ? commonUtils.getHumanDate(upload.updatedAt)
                  : "Never",
                sortingValue: upload?.updatedAt ?? "",
              },
              actions: {
                content: (
                  <span className={styles.actions}>
                    <Button compact onClick={() => openTokens(project.slug)}>
                      {tokensLabel(project.tokens.length)}
                    </Button>
                    <Button
                      compact
                      color={ButtonColor.RED}
                      onClick={() => askRemove(project)}
                    >
                      Delete
                    </Button>
                  </span>
                ),
              },
            };
          })}
        />
      </Box>
    </>
  );
};
