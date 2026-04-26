import { verifyToken } from "./jwt";
import { NextRequest } from "next/server";

export function getUserFromRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token) as any;

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}