import { FC } from "react";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

interface IWheelOptionsProps {
  isWithBlur?: boolean;
}

export const WheelOptions: FC<IWheelOptionsProps> = ({ isWithBlur }) => {
  const { isRoyal, setRoyal } = useStatesStore();
  const { timer, setTimer } = useCommonStore();

  return (
    <WrapperTemplate
      isWithBlur={isWithBlur}
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
    </WrapperTemplate>
  );
};
