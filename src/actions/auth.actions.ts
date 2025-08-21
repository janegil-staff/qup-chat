"use server";

import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function checkAuthStatus() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) return { success: false };

  // namespaces are really important to understand in redis
  const userId = `user:${user.id}`;

  const existingUser = await redis.hgetall(userId);

  // sign up case: bc user is visiting our platform for the first time
  if (!existingUser || Object.keys(existingUser).length === 0) {
    const imgIsNull = user.picture?.includes("gravatar");
    const image = imgIsNull ? "" : user.picture;
    const userData: Record<string, string> = {};

    if (user.id) userData.id = user.id;
    if (user.email) userData.email = user.email;
    if (user.given_name || user.family_name) {
      userData.name = `${user.given_name ?? ""} ${
        user.family_name ?? ""
      }`.trim();
    }

    await redis.hset(userId, userData);
  }

  return { success: true };
}
