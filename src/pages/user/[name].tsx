import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { categoriesType } from "@/src/lib/shared/types/user.type";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
  userGames: Record<categoriesType, IGDBGameMinimal[]>;
}

const User: FC<IProps> = ({ user, userGames }) => {
  return <UserProfile {...{ ...user, games: userGames }} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const user = (await userAPI.getByName(query.name as string)).data;
  const userGames = (await userAPI.getUserGames(user._id)).data.games;
  const cookies = context.req.cookies;
  console.log(cookies);

  return { props: { user, userGames } };
};

export default User;
