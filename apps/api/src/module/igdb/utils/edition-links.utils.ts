type TEditionGame<Id> = {
  _id: Id;
  igdb: { gameId: number; version_parent?: number | null };
};

export const buildEditionLinks = <Id>(games: TEditionGame<Id>[]) => {
  const idByIgdbId = new Map(games.map((game) => [game.igdb.gameId, game._id]));
  const editionsByParent = new Map<number, Id[]>();

  for (const game of games) {
    const parent = game.igdb.version_parent;

    if (parent && idByIgdbId.has(parent)) {
      editionsByParent.set(parent, [
        ...(editionsByParent.get(parent) ?? []),
        game._id,
      ]);
    }
  }

  const links = new Map<string, { version_parent?: Id; editions: Id[] }>();

  for (const game of games) {
    const parent = game.igdb.version_parent;
    const parentId = parent ? idByIgdbId.get(parent) : undefined;
    const editions = (
      parentId
        ? (editionsByParent.get(parent!) ?? [])
        : (editionsByParent.get(game.igdb.gameId) ?? [])
    ).filter((id) => String(id) !== String(game._id));

    if (parentId || editions.length) {
      links.set(String(game._id), { version_parent: parentId, editions });
    }
  }

  return links;
};
