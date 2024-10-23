import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { getUserById } from "@/src/lib/shared/api/user";
import { GetServerSideProps } from "next";
import { FC } from "react";

const User: FC = () => {


  return <UserProfile name={"alex"} email={"alex@mail.com"}  />;
};


// export const getServerSideProps = (async () => {
//   // Fetch data from external API
//   const user = await getUserById(id);
//   // Pass data to the page via props
//   return { props: { user } }
// })
export default User;
