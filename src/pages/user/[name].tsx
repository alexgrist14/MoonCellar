import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { categoriesType, ILogs } from "@/src/lib/shared/types/user.type";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
  userGames: Record<categoriesType, IGDBGameMinimal[]>;
  userLogs: ILogs[];
}

const User: FC<IProps> = ({ user, userGames, userLogs}) => {
  return <UserProfile {...{user, games: userGames, logs: userLogs }} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const user = (await userAPI.getByName(query.name as string)).data;
  const userGames = (await userAPI.getUserGames(user._id)).data.games;
  const userLogs = (await userAPI.getUserLogs(user._id)).data[0].logs.reverse();


  return { props: { user, userGames, userLogs } };
};

export default User;
