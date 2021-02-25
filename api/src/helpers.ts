import jwt from "jsonwebtoken";
import { User } from "./entities/User";

export const validateAuthorizationHeader = async (
  authHeader: string | undefined
) => {
  if (!authHeader) {
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return;
  }

  let userUuid;
  try {
    const payload: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    userUuid = payload.userUuid;
  } catch (err) {
    return;
  }

  if (!userUuid) {
    return;
  }

  return await User.findOne({ where: { uuid: userUuid } });
};

export const isUserActive = (at: Date) => {
  const oneHourAgo = new Date();
  oneHourAgo.setUTCHours(oneHourAgo.getUTCHours() - 1);
  return at > oneHourAgo;
};
