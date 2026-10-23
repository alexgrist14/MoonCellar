"use client";

import { FC } from "react";
import { Box } from "@/src/lib/shared/ui/Box";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import {
  HubConnector,
  ProjectsManager,
} from "@/src/lib/widgets/status/ProjectsManager";

export const StatusManagePage: FC = () => (
  <>
    <Box>
      <SectionTitle as="h1">Manage projects</SectionTitle>
    </Box>
    <ProjectsManager />
    <HubConnector />
  </>
);
