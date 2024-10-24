import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { getUserById } from "@/src/lib/shared/api/user";
import { IUser } from "@/src/lib/shared/types/auth";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

interface IProps {
  user: IUser;
  id: string;
}

const User: FC<IProps> = ({ user, id }) => {
  return <UserProfile name={"alex"} email={"alex@mail.com"} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;

  const user = await getUserById(query.id as string);
  
  return { props: { user, id: query.id } };
};
export default User;
