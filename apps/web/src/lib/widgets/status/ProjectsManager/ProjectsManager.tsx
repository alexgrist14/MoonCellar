"use client";

import { FC, useState } from "react";
import { IProject, IProjectToken } from "@mooncellar/schemas";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useRotateProjectTokenMutation,
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
import { ProjectTokenNotice } from "./ProjectTokenNotice";
import styles from "./ProjectsManager.module.scss";

const EDIT_MODAL_ID = "status-project-edit";
const CONFIRM_MODAL_ID = "status-project-confirm";

export const ProjectsManager: FC = () => {
  const { data: projects = [], isLoading } = useProjectsQuery();
  const [isCreating, setIsCreating] = useState(false);
  const [token, setToken] = useState<IProjectToken | null>(null);
  const { mutate: create, isPending: isCreatePending } =
    useCreateProjectMutation();
  const { mutateAsync: update } = useUpdateProjectMutation();
  const { mutateAsync: remove } = useDeleteProjectMutation();
  const { mutateAsync: rotate } = useRotateProjectTokenMutation();

  const confirm = (props: {
    title: string;
    message: string;
    warning: string;
    confirmText: string;
    onConfirm: () => Promise<unknown>;
  }) =>
    modal.open(
      <ConfirmModal
        {...props}
        onCancel={() => modal.close(CONFIRM_MODAL_ID)}
        onConfirm={async () => {
          await props.onConfirm();
          modal.close(CONFIRM_MODAL_ID);
        }}
      />,
      { id: CONFIRM_MODAL_ID }
    );

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

  const askRotate = (project: IProject) =>
    confirm({
      title: "New upload token",
      message: `Issue a new upload token for ${project.name}?`,
      warning:
        "The current token stops working at once; update it wherever the project uploads from.",
      confirmText: "Issue token",
      onConfirm: () => rotate(project.slug).then(setToken),
    });

  const askRemove = (project: IProject) =>
    confirm({
      title: "Delete project",
      message: `Delete ${project.name} and everything it uploaded?`,
      warning:
        "Its token stops working. A new project with the same address starts empty.",
      confirmText: "Delete",
      onConfirm: () =>
        remove(project.slug).then(() =>
          toast.success({ description: `${project.name} deleted` })
        ),
    });

  return (
    <>
      {token && (
        <ProjectTokenNotice token={token} onClose={() => setToken(null)} />
      )}
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
                  setToken(created);
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
          A project uploads its blocks with its own token; the hub shows them
          here. Click a row to rename it or change its blocks.
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
            actions: { content: "Token", isNotSortable: true },
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
                    <Button compact onClick={() => askRotate(project)}>
                      New token
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
