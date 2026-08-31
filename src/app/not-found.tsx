import { Metadata } from "next";
import { NotFoundPage } from "../lib/pages/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist on MoonCellar.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundPage />;
}
