import { GauntletPage } from "@/src/lib/pages/GauntletPage/GauntletPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gauntlet",
  description: "Spin the wheel and find your new favorite game",
};

const GauntletPageIndex = () => {
  return <GauntletPage />;
};

export default GauntletPageIndex;
