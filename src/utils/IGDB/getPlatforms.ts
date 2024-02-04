import { Dispatch, SetStateAction } from "react";
import { IIGDBPlatform, IIGDBPlatformFamily } from "../../interfaces";
import { IGDBAgent } from "../../api";
import { store } from "../../store";
import { setLoading } from "../../store/statesSlice";

export const getPlatforms = (
  setPlatforms: Dispatch<SetStateAction<IIGDBPlatform[]>>,
  generation?: number
) => {
  IGDBAgent("https://api.igdb.com/v4/platforms", {
    fields:
      "name, slug, platform_family, platform_logo, created_at, generation",
    limit: 500,
    where: `${
      !!generation ? `generation <= ${generation} & ` : ""
    }platform_logo != null`,
  }).then((response) => {
    setPlatforms(
      response.data.sort((a: IIGDBPlatform, b: IIGDBPlatform) =>
        a.name > b.name ? 1 : -1
      )
    );
    store.dispatch(setLoading(false));
  });
};

export const getPlatformFamilies = (
  setPlatformFamilies: Dispatch<SetStateAction<IIGDBPlatformFamily[]>>
) => {
  IGDBAgent("https://api.igdb.com/v4/platform_families", {
    fields: "name, slug",
    limit: 500,
  }).then((response) => setPlatformFamilies(response.data));
};
