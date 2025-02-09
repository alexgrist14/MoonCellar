import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { IUser } from "@/src/lib/shared/types/auth";
import { IFollowings, ILogs } from "@/src/lib/shared/types/user.type";
import { mergeLogs } from "@/src/lib/shared/utils/logs";
import { jwtDecode } from "jwt-decode";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
  userLogs: ILogs[];
  authUserFollowings: IFollowings;
  authUserId: string;
}

const User: FC<IProps> = ({
  user,
  userLogs,
  authUserFollowings,
  authUserId,
}) => {
  return (
    <UserProfile
      {...{ user, logs: userLogs, authUserFollowings, authUserId }}
    />
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query, req } = context;

  const token = req.cookies[ACCESS_TOKEN];
  const authUserInfo: { id: string } | undefined = !!token
    ? jwtDecode(token)
    : undefined;

  const authUserFollowings = !!authUserInfo
    ? (await userAPI.getUserFollowings(authUserInfo.id)).data
    : undefined;

  const user = (await userAPI.getByName(query.name as string)).data;
  const userFollowings = (await userAPI.getUserFollowings(user._id)).data;
  const logsResult = (await userAPI.getUserLogs(user._id)).data;
  const userLogs = logsResult.length > 0 ? mergeLogs(logsResult[0].logs) : [];
  user.raUsername && await userAPI.setRaUserInfo(user._id, user.raUsername)

  return {
    props: {
      user: { ...user, followings: userFollowings },
      userLogs: userLogs || null,
      authUserFollowings: authUserFollowings || null,
      authUserId: authUserInfo?.id || null,
    },
  };
};

export default User;
