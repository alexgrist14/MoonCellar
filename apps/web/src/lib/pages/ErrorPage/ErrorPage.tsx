"use client";

import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";

interface IErrorPageProps {
  onRetry: () => void;
}

export const ErrorPage = ({ onRetry }: IErrorPageProps) => {
  return (
    <Box contentStyle={{ minHeight: "var(--page-height-available)" }}>
      <EmptyState
        variant="page"
        as="h1"
        title="Something went wrong"
        description="The page could not be loaded. Try again in a moment, or head back to the home page."
        action={
          <>
            <Button color={ButtonColor.ACCENT} onClick={onRetry}>
              Try again
            </Button>
            <Button href="/">Back to home</Button>
          </>
        }
      />
    </Box>
  );
};
