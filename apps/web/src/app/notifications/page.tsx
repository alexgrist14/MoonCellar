import { Metadata } from "next";
import { NotificationsPage } from "@/src/lib/pages/NotificationsPage";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default NotificationsPage;
