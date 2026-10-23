"use client";

import { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectsQuery } from "@/src/lib/entities/project/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";

export const StatusHomePage: FC = () => {
  const router = useRouter();
  const { data: projects, isLoading } = useProjectsQuery();
  const first = projects?.[0];

  useEffect(() => {
    if (first) router.replace(`/${first.slug}`);
  }, [first, router]);

  if (isLoading || first) {
    return (
      <Box>
        <Skeleton height="240px" />
      </Box>
    );
  }

  return (
    <Box>
      <EmptyState
        title="No projects yet"
        description="Add a project, then send its blocks with the token it gets."
        action={
          <Button color={ButtonColor.ACCENT} href="/manage">
            Manage projects
          </Button>
        }
      />
    </Box>
  );
};
