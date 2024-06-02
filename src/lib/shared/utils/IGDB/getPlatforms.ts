import { store } from "@/src/lib/app/store";
import { IGDBAgent } from "../../api";
import { IIGDBPlatform, IIGDBPlatformFamily } from "../../types/igdb";
import {
  setIGDBFamilies,
  setSystemsIGDB,
} from "@/src/lib/app/store/slices/commonSlice";
import { setSelectedSystemsIGDB } from "@/src/lib/app/store/slices/selectedSlice";
import { setPlatformsLoading } from "@/src/lib/app/store/slices/statesSlice";

export const getPlatforms = (generation?: number) => {
  const { selectedSystemsIGDB } = store.getState().selected;

  IGDBAgent<IIGDBPlatform[]>("https://api.igdb.com/v4/platforms", {
    fields:
      "name, slug, platform_family, platform_logo, created_at, generation",
    limit: 500,
    where: `${
      !!generation ? `generation <= ${generation} & ` : ""
    }platform_logo != null`,
  }).then((response) => {
    store.dispatch(
      setSystemsIGDB(
        response.data.sort((a: IIGDBPlatform, b: IIGDBPlatform) =>
          a.name > b.name ? 1 : -1
        )
      )
    );

    store.dispatch(
      setSelectedSystemsIGDB(
        selectedSystemsIGDB.filter((system) =>
          response.data.some((platform) => platform.id === system.id)
        )
      )
    );

    store.dispatch(setPlatformsLoading(false));
  });
};

export const getPlatformFamilies = () => {
  IGDBAgent<IIGDBPlatformFamily[]>(
    "https://api.igdb.com/v4/platform_families",
    {
      fields: "name, slug",
      limit: 500,
    }
  ).then((response) => store.dispatch(setIGDBFamilies(response.data)));
};
