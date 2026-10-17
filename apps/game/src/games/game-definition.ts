export type IReplayCheck = (
  replay: Buffer,
  score: number,
  accepted: Buffer[]
) => string | null;

export type IGameDefinition = {
  slug: string;
  name: string;
  scoreOrder: "asc" | "desc";
  scoreUnit: "ms" | "points";
  board: RegExp;
  replay: {
    required: boolean;
    maxBytes: number;
    check?: IReplayCheck;
  };
};
