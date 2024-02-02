import { buildAuthorization } from "@retroachievements/api";
import { IAuth } from "../interfaces/responses";

const userName = "alexgrist14";
const webApiKey = process.env.REACT_APP_RETROACHIEVEMENTS_API_KEY || "fail";

export const authorization: IAuth = buildAuthorization({ userName, webApiKey });
