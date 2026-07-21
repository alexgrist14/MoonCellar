import { FC } from "react";
import { Box } from "@/src/lib/shared/ui/Box";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

export const WheelOptions: FC = () => {
  const { isRoyal, setRoyal } = useStatesStore();
  const { timer, setTimer } = useCommonStore();

  return (
    <Box
      contentStyle={{
        gap: "15px",
      }}
    >
      <ToggleSwitch
        clickCallback={(result) => {
          setRoyal(result === "ON");
        }}
        defaultValue={isRoyal ? "right" : "left"}
        label="Royal mode:"
      />
      <RangeSelector
        min={0.1}
        max={20}
        step={0.1}
        defaultValue={timer}
        callback={(value) => setTimer(value)}
        text={`Time: ${timer} seconds`}
      />
    </Box>
  );
};
