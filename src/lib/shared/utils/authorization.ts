import { buildAuthorization } from "@retroachievements/api";
import { IAuth } from "../types/responses";

const userName = "alexgrist14";
const webApiKey = process.env.NEXT_PUBLIC_RETROACHIEVEMENTS_API_KEY || "fail";

export const authorization: IAuth = buildAuthorization({ userName, webApiKey });
