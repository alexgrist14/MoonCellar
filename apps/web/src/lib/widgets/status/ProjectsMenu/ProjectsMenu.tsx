"use client";

import { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import { IProject, IProjectBlock } from "@mooncellar/schemas";
import { getProjectSummary } from "@/src/lib/entities/project/model";
import { Box } from "@/src/lib/shared/ui/Box";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { SvgCode, SvgListBullet, SvgSettings } from "@/src/lib/shared/ui/svg";
import styles from "./ProjectsMenu.module.scss";

export const MANAGE_PROJECTS_PATH = "/manage";

interface IProjectsMenuProps {
  projects: IProject[];
  isLoading: boolean;
  current: string | null;
}

const BLOCK_ICONS: Record<IProjectBlock, FC<{ size?: "16" }>> = {
  decomp: SvgCode,
  plan: SvgListBullet,
};

const MANAGE_LABEL = "Manage projects";

export const ProjectsMenu: FC<IProjectsMenuProps> = ({
  projects,
  isLoading,
  current,
}) => {
  const router = useRouter();
  const isManage = current === MANAGE_PROJECTS_PATH.slice(1);
  const labels = [...projects.map((project) => project.name), MANAGE_LABEL];
  const currentLabel = isManage
    ? MANAGE_LABEL
    : projects.find((project) => project.slug === current)?.name;

  const openIndex = (index: number) => {
    if (index < 0) return;
    router.push(
      index < projects.length
        ? `/${projects[index].slug}`
        : MANAGE_PROJECTS_PATH
    );
  };

  return (
    <>
      <div className={styles.menu}>
        <Box>
          <nav aria-label="Projects" className={styles.menu__nav}>
            <p className={styles.menu__caption}>Projects</p>
            {isLoading && (
              <Skeleton count={2} height="56px" gap="var(--gap-x1)" />
            )}
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/${project.slug}`}
                aria-current={project.slug === current ? "page" : undefined}
                className={styles.item}
              >
                <span className={styles.item__name}>{project.name}</span>
                <span className={styles.item__blocks}>
                  {project.blocks.map((block) => {
                    const Icon = BLOCK_ICONS[block];
                    return <Icon key={block} size="16" />;
                  })}
                </span>
                <span className={styles.item__meta}>
                  {getProjectSummary(project)}
                </span>
              </Link>
            ))}
            <div className={styles.menu__separator} />
            <Link
              href={MANAGE_PROJECTS_PATH}
              aria-current={isManage ? "page" : undefined}
              className={classNames(styles.item, styles.item_manage)}
            >
              <span className={styles.item__name}>{MANAGE_LABEL}</span>
              <span className={styles.item__blocks}>
                <SvgSettings size="16" />
              </span>
            </Link>
          </nav>
        </Box>
      </div>
      <div className={styles.mobile}>
        <Dropdown
          list={labels}
          overwriteValue={currentLabel}
          placeholder="Pick a project"
          getIndex={openIndex}
          isLoading={isLoading}
          isWithSearch={false}
          isThroughPortal
        />
      </div>
    </>
  );
};
