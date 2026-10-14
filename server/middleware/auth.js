import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { getUserById } from "../utils/sql.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, "Not authorized, please log in");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const user = await getUserById(payload.id);
  if (!user || user.account_status === "disabled") {
    throw new ApiError(401, "This account no longer exists");
  }

  req.user = user;
  next();
});
