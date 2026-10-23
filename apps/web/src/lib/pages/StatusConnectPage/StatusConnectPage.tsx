"use client";

import { FC, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectTokenNameSchema } from "@mooncellar/schemas";
import {
  useConnectProjectMutation,
  useProjectsQuery,
} from "@/src/lib/entities/project/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { SvgLink } from "@/src/lib/shared/ui/svg";
import {
  getConnectCallbackUrl,
  readConnectRequest,
} from "@/src/lib/shared/utils/status-path.utils";
import styles from "./StatusConnectPage.module.scss";

export const StatusConnectPage: FC = () => {
  const request = readConnectRequest(useSearchParams());
  const { data: projects, isLoading } = useProjectsQuery();
  const { mutate: connect, isPending } = useConnectProjectMutation();
  const [isCancelled, setIsCancelled] = useState(false);
  const project = projects?.find((item) => item.slug === request?.project);

  if (!request || !ProjectTokenNameSchema.safeParse(request.name).success) {
    return (
      <Box>
        <EmptyState
          variant="page"
          as="h1"
          title="This connect link is incomplete"
          description="Run the project's connect command again; it opens the right link by itself."
        />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="200px" />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <EmptyState
          variant="page"
          as="h1"
          title="No project at this address"
          description={`There is no project called "${request.project}". Create it in Manage projects, then run the connect command again.`}
          action={
            <Button color={ButtonColor.ACCENT} href="/manage">
              Manage projects
            </Button>
          }
        />
      </Box>
    );
  }

  if (isCancelled) {
    return (
      <Box>
        <EmptyState
          variant="page"
          as="h1"
          title="Not connected"
          description="Nothing was issued. You can close this tab; the command in the terminal stops by itself."
        />
      </Box>
    );
  }

  const allow = () =>
    connect(
      { slug: project.slug, name: request.name },
      {
        onSuccess: ({ code }) =>
          window.location.assign(getConnectCallbackUrl(request, code)),
      }
    );

  return (
    <Box>
      <div className={styles.page}>
        <SvgLink size="40" />
        <SectionTitle as="h1">Connect {request.name}</SectionTitle>
        <p className={styles.page__text}>
          <strong>{request.name}</strong> asks for its own upload token for{" "}
          <strong>{project.name}</strong>. Allow it only if you have just run
          the connect command there: the token goes to the program waiting on
          this computer at{" "}
          <code className={styles.page__code}>127.0.0.1:{request.port}</code>,
          and you can revoke it later in Manage projects.
        </p>
        <div className={styles.page__actions}>
          <Button
            color={ButtonColor.TRANSPARENT}
            disabled={isPending}
            onClick={() => setIsCancelled(true)}
          >
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            isLoading={isPending}
            disabled={isPending}
            onClick={allow}
          >
            Allow
          </Button>
        </div>
      </div>
    </Box>
  );
};
