import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { categoriesType, ILogs } from "@/src/lib/shared/types/user.type";
import { removeDuplicateLogs } from "@/src/lib/shared/utils/logs";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;

  userLogs: ILogs[];
}

const User: FC<IProps> = ({ user, userLogs }) => {
  return <UserProfile {...{ user, logs: userLogs }} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const user = (await userAPI.getByName(query.name as string)).data;
  const logsResult = (await userAPI.getUserLogs(user._id)).data;
  let userLogs: ILogs[];
  if (logsResult.length > 0) {
    userLogs = removeDuplicateLogs(logsResult[0].logs).reverse();
  } else userLogs = [];

  return { props: { user, userLogs } };
};

export default User;
