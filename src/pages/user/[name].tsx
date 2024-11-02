import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { getUserById, getUserByName } from "@/src/lib/shared/api/user";
import { IUser } from "@/src/lib/shared/types/auth";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
}

const User: FC<IProps> = ({ user }) => {
  return <UserProfile name={user.name} email={user.email} id={user._id} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const user = await getUserByName(query.name as string);

  return { props: { user } };
};
export default User;
