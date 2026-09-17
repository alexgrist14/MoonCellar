import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { jwtDecode } from "jwt-decode";
import {
  CUSTOM_LIST_GAMES_PAGE_SIZE,
  GetCustomListBySlugRequestSchema,
  GetUserByStringSchema,
  ICustomListDetails,
  IGameResponse,
} from "@mooncellar/schemas";
import { CustomListPage } from "@/src/lib/pages/CustomListPage";
import {
  agent,
  gamesApi,
  playthroughsAPI,
  userAPI,
} from "@/src/lib/shared/api";
import { ACCESS_TOKEN, API_URL } from "@/src/lib/shared/constants";
import { IAuthToken } from "@/src/lib/shared/types/auth.type";
import { getListHref } from "@/src/lib/shared/ui/ListCard";
import { fetchOrNull } from "@/src/lib/shared/utils/not-found.utils";

interface IListRouteProps {
  params: Promise<{ name: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const isValidRequest = (userName: string, slug: string) =>
  GetUserByStringSchema.safeParse({ searchString: userName }).success &&
  GetCustomListBySlugRequestSchema.safeParse({ userName, slug }).success;

const getList = cache(
  async (userName: string, slug: string, cookieHeader: string) =>
    isValidRequest(userName, slug)
      ? fetchOrNull(
          agent.get<ICustomListDetails>(`${API_URL}/lists/by-slug`, {
            params: { userName, slug },
            headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
          })
        )
      : null
);

const getUser = cache(async (userName: string) =>
  fetchOrNull(userAPI.getByString(userName))
);

const getCookieHeader = async () => (await cookies()).toString();

export async function generateMetadata({
  params,
}: IListRouteProps): Promise<Metadata> {
  const { name, slug } = await params;

  try {
    const list = await getList(name, slug, await getCookieHeader());

    if (!list) {
      return {
        title: "Page not found",
        robots: { index: false, follow: false },
      };
    }

    const author = list.author?.userName ?? name;

    return {
      title: `${list.name} — a list by ${author}`,
      description:
        list.description ||
        `${list.gamesCount} games collected by ${author} on MoonCellar`,
      alternates: { canonical: getListHref(list) },
      ...(list.isPrivate && { robots: { index: false, follow: false } }),
    };
  } catch {
    return { title: "List" };
  }
}

export default async function CustomListRoute({
  params,
  searchParams,
}: IListRouteProps) {
  const { name, slug } = await params;
  const { page: pageParam } = await searchParams;
  const cookieStore = await cookies();

  const list = await getList(name, slug, cookieStore.toString());

  if (!list) {
    notFound();
  }

  const page = Math.max(1, Number(pageParam) || 1);

  if (list.slug !== slug) {
    permanentRedirect(`${getListHref(list)}${page > 1 ? `?page=${page}` : ""}`);
  }

  const user = await getUser(list.author?.userName ?? name);

  if (!user) {
    notFound();
  }

  const accessToken = cookieStore.get(ACCESS_TOKEN)?.value;
  const authUserInfo: IAuthToken | undefined = accessToken
    ? jwtDecode(accessToken)
    : undefined;

  const pageIds = list.games
    .slice(
      (page - 1) * CUSTOM_LIST_GAMES_PAGE_SIZE,
      page * CUSTOM_LIST_GAMES_PAGE_SIZE
    )
    .map((game) => game.gameId);

  const [playthroughs, pageGames] = await Promise.all([
    playthroughsAPI
      .getAll({ userId: user._id })
      .then(({ data }) => data)
      .catch(() => []),
    pageIds.length
      ? gamesApi
          .getByIds({ _ids: pageIds })
          .then(({ data }) => data)
          .catch((): IGameResponse[] => [])
      : Promise.resolve<IGameResponse[]>([]),
  ]);

  const initialGames = pageIds.flatMap((id) => {
    const game = pageGames.find((item) => item._id === id);

    return game ? [game] : [];
  });

  return (
    <CustomListPage
      list={list}
      user={user}
      playthroughs={playthroughs}
      authUserId={authUserInfo?.id}
      initialPage={page}
      initialGames={initialGames}
    />
  );
}
