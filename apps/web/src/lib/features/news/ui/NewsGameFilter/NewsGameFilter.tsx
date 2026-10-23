import { FC } from "react";
import { IGetArticlesQuery } from "@mooncellar/schemas";
import { useGameSearch } from "@/src/lib/entities/game/model";
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { pushNewsQuery } from "@/src/lib/features/news/model/news-query.utils";

interface INewsGameFilterProps {
  params: IGetArticlesQuery;
}

export const NewsGameFilter: FC<INewsGameFilterProps> = ({ params }) => {
  const gameSearch = useGameSearch();

  return (
    <SearchPicker
      label="About a game"
      placeholder="Find a game…"
      search={gameSearch.search}
      onSearch={gameSearch.setSearch}
      options={gameSearch.options}
      isLoading={gameSearch.isLoading}
      onPick={(option) => {
        gameSearch.setSearch("");
        pushNewsQuery({ ...params, game: option.id, page: 1 });
      }}
    />
  );
};
