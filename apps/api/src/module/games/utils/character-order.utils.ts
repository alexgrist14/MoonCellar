const ROLE_RANK: Record<string, number> = {
  main: 0,
  primary: 1,
  side: 3,
  appears: 4,
};
const UNKNOWN_RANK = 2;
const PROTAGONIST_PATTERN =
  /\b(main (?:protagonist|character|heroine|hero)|protagonist)\b/i;

type TOrderedCharacter = {
  name?: string | null;
  description?: string | null;
  roles?: { gameId: unknown; role: string }[] | null;
  vndb?: { roles?: Record<string, string> } | null;
};

export const getCharacterRank = (
  character: TOrderedCharacter,
  vnId?: string | null,
  gameId?: string | null
) => {
  const role =
    (gameId &&
      character.roles?.find((entry) => String(entry.gameId) === gameId)
        ?.role) ||
    (vnId ? character.vndb?.roles?.[vnId] : undefined);

  if (role) return ROLE_RANK[role] ?? UNKNOWN_RANK;

  return PROTAGONIST_PATTERN.test(character.description ?? "")
    ? ROLE_RANK.main
    : UNKNOWN_RANK;
};

export const sortCharactersByRole = <T extends TOrderedCharacter>(
  characters: T[],
  vnId?: string | null,
  gameId?: string | null
) =>
  characters
    .map((character) => ({
      character,
      rank: getCharacterRank(character, vnId, gameId),
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        (a.character.name ?? "").localeCompare(b.character.name ?? "")
    )
    .map(({ character }) => character);
