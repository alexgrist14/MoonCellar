import { FC } from "react";
import { Box } from "@/src/lib/shared/ui/Box";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";

export const WheelOptions: FC = () => {
  const { isRoyal, setRoyal } = useStatesStore();
  const { timer, setTimer } = useCommonStore();
  const { isMusicEnabled, setMusicEnabled, musicVolume, setMusicVolume } =
    useSettingsStore();

  return (
    <Box
      contentStyle={{
        gap: "15px",
      }}
    >
      <div style={{ display: "flex", gap: "var(--gap-x5)" }}>
        <ToggleSwitch
          clickCallback={(result) => {
            setRoyal(result === "ON");
          }}
          defaultValue={isRoyal ? "right" : "left"}
          label="Royal mode:"
        />
        <ToggleSwitch
          clickCallback={(result) => {
            setMusicEnabled(result === "ON");
          }}
          value={isMusicEnabled ? "right" : "left"}
          label="Music:"
        />
      </div>
      <RangeSelector
        min={0}
        max={100}
        step={5}
        disabled={!isMusicEnabled}
        defaultValue={(musicVolume ?? 1) * 100}
        callback={(value) => setMusicVolume(value / 100)}
        text={`Volume: ${Math.round((musicVolume ?? 1) * 100)}%`}
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
