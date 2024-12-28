import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth";
import { CategoriesCount, ILogs } from "@/src/lib/shared/types/user.type";
import { mergeLogs } from "@/src/lib/shared/utils/logs";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
  userGamesLength: CategoriesCount;

  userLogs: ILogs[];
}

const User: FC<IProps> = ({ user, userGamesLength, userLogs }) => {
  return <UserProfile {...{ user, logs: userLogs, userGamesLength }} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const user = (await userAPI.getByName(query.name as string)).data;
  const userGamesLength = (await userAPI.getUserGamesLength(user._id)).data;
  console.log(userGamesLength);
  const logsResult = (await userAPI.getUserLogs(user._id)).data;
  let userLogs: ILogs[];
  if (logsResult.length > 0) {
    userLogs = mergeLogs(logsResult[0].logs);
  } else userLogs = [];

  return { props: { user, userLogs, userGamesLength } };
};

export default User;
