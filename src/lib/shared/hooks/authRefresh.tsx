// import { useAuthStore } from "@/shared/store";
// import { axiosUtils } from "@/shared/utils/axios";
// import { useEffect, useState } from "react";
// import { zodUtils } from "@/shared/utils/zod";
// import { authApi, vacancyAPI } from "@/shared/api";
// import { ProfileResponseSchema } from "courses-contracts/dist";

// export const useAuthRefresh = (auth: boolean, meId: string) => {
//   const { clear, setProfile, setVacancy } = useAuthStore();
//   const [isLoading, setLoading] = useState(auth);

//   const refresh = () => {
//     setLoading(true);
//     authApi
//       .refresh()
//       .then(() => {
//         authApi
//           .me(meId)
//           .then((response) => {
//             const profile = zodUtils.parseDev(
//               response.data,
//               ProfileResponseSchema
//             );

//             setProfile(profile);

//             !!profile.vacancyId &&
//               vacancyAPI
//                 .getVacancyById(profile.vacancyId)
//                 .then((res) => setVacancy(res.data));
//           })
//           .catch((error) => {
//             axiosUtils.toastError(error);
//           });
//       })
//       .catch((error) => {
//         axiosUtils.toastError(error);
//         clear();
//       })
//       .finally(() => setLoading(false));
//   };

//   useEffect(() => {
//     if (auth) refresh();
//     else clear();
//   }, []);

//   return { isLoading };
// };
