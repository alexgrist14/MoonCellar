"use client";

import { FC } from "react";
import classNames from "classnames";
import {
  IDecompBlock,
  IProjectBlock,
  PROJECT_BLOCKS,
} from "@mooncellar/schemas";
import {
  useProjectBlockQuery,
  useProjectPlanQuery,
  useProjectsQuery,
} from "@/src/lib/entities/project/api";
import {
  PROJECT_BLOCK_TITLES,
  getProjectUpload,
  isStaleUpload,
} from "@/src/lib/entities/project/model";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { SvgClock, SvgListBullet } from "@/src/lib/shared/ui/svg";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { DecompBlock } from "@/src/lib/widgets/status/DecompBlock";
import { PlanBlock } from "@/src/lib/widgets/status/PlanBlock";
import { StatusProjectSkeleton } from "./StatusProjectSkeleton";
import styles from "./StatusProjectPage.module.scss";

interface IStatusProjectPageProps {
  slug: string;
  block?: string;
}

const isBlock = (value?: string): value is IProjectBlock =>
  PROJECT_BLOCKS.includes(value as IProjectBlock);

export const StatusProjectPage: FC<IStatusProjectPageProps> = ({
  slug,
  block,
}) => {
  const { data: projects, isLoading } = useProjectsQuery();
  const project = projects?.find((item) => item.slug === slug);
  const active =
    project &&
    (isBlock(block) && project.blocks.includes(block)
      ? block
      : project.blocks[0]);
  const upload =
    project && active ? getProjectUpload(project, active) : undefined;
  const isPlan = active === "plan";
  const { data: decomp, isLoading: isDecompLoading } =
    useProjectBlockQuery<IDecompBlock>(slug, "decomp", !isPlan && !!upload);
  const { data: plan, isLoading: isPlanLoading } = useProjectPlanQuery(
    slug,
    isPlan
  );
  const commit = isPlan ? undefined : decomp?.commit;

  if (isLoading) return <StatusProjectSkeleton />;

  if (!project || !active) {
    return (
      <Box>
        <EmptyState
          variant="page"
          as="h1"
          title="No project at this address"
          description={`There is no project called "${slug}". It may have been deleted or renamed.`}
          action={
            <Button color={ButtonColor.ACCENT} href="/manage">
              Manage projects
            </Button>
          }
        />
      </Box>
    );
  }

  const isStale = isStaleUpload(upload);

  return (
    <>
      <Box>
        <div className={styles.head}>
          <div className={styles.head__row}>
            <SectionTitle as="h1">{project.name}</SectionTitle>
            <span
              className={classNames(styles.updated, {
                [styles.updated_stale]: isStale,
              })}
            >
              <SvgClock size="16" />
              {upload
                ? `Updated ${commonUtils.getHumanDate(upload.updatedAt)}`
                : isPlan
                  ? "No changes yet"
                  : "Never uploaded"}
              {commit && (
                <code className={styles.commit}>{commit.slice(0, 7)}</code>
              )}
            </span>
          </div>
          {project.blocks.length > 1 && (
            <Tabs
              ariaLabel="Blocks"
              defaultTabIndex={project.blocks.indexOf(active)}
              isUseDefaultIndex
              contents={project.blocks.map((item) => ({
                tabName: PROJECT_BLOCK_TITLES[item],
                tabLink: `/${project.slug}/${item}`,
              }))}
            />
          )}
        </div>
      </Box>
      {!isPlan && !upload && (
        <Box>
          <EmptyState
            variant="inline"
            icon={<SvgListBullet size="24" />}
            title={`No ${PROJECT_BLOCK_TITLES[active]} block yet`}
            description={`The project sends it with its token: PUT /projects/${project.slug}/data/${active}. Issue or replace the token in Manage projects.`}
          />
        </Box>
      )}
      {((isPlan && (isPlanLoading || !plan)) ||
        (!isPlan && upload && (isDecompLoading || !decomp))) && (
        <Box>
          <Skeleton height="320px" />
        </Box>
      )}
      {isPlan && plan && <PlanBlock slug={project.slug} plan={plan} />}
      {!isPlan && upload && decomp && <DecompBlock decomp={decomp} />}
    </>
  );
};
