import type { IGameDefinition } from "../game-definition";
import { checkEnds, checkRun, endsOf, parseGhost } from "./ghost";

export const rooftops: IGameDefinition = {
  slug: "rooftops",
  name: "Rooftops",
  scoreOrder: "asc",
  scoreUnit: "ms",
  board: /^level-([1-9]|[1-9][0-9])$/,
  replay: {
    required: true,
    maxBytes: 256 * 1024,
    check: (replay, score, accepted) => {
      const run = parseGhost(replay);
      if (typeof run === "string") return run;
      const ends = accepted.flatMap((data) => {
        const other = parseGhost(data);
        return typeof other === "string" ? [] : [endsOf(other)];
      });
      return checkRun(run, score) ?? checkEnds(run, ends);
    },
  },
};
