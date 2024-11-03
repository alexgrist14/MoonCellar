import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
}

const User: FC<IProps> = ({ user }) => {
  return <UserProfile {...user} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  const user = (await userAPI.getByName(query.name as string)).data;

  return { props: { user } };
};

export default User;
