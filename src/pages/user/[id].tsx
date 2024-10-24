import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { getUserById } from "@/src/lib/shared/api/user";
import { IUser } from "@/src/lib/shared/types/auth";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { FC } from "react";

interface UserProps{
  user: any;
  id: string;
}

const User: FC<UserProps> = ({user, id}) => {
  console.log(user)
  return <UserProfile name={user.name} email={user.email}  />;
};


export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const {query} = context;
  const user = await getUserById(query.id as string);
  return { props: { user, id: query.id } };
};
export default User;
