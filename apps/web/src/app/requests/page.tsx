import { Metadata } from "next";
import { Suspense } from "react";
import { RequestsPage } from "@/src/lib/pages/RequestsPage";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

export const metadata: Metadata = {
  title: "Requests",
  description: "Suggest a new game or character, or a correction",
  robots: { index: false, follow: true },
};

const RequestsRoute = () => (
  <Suspense fallback={<PageLoader />}>
    <RequestsPage />
  </Suspense>
);

export default RequestsRoute;
