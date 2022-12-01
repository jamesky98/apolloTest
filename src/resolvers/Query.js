/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
import { chkUserId } from "../utils.js";

async function getNowUser(parent, args, context) {
  const result = await context.prisma.user.findUnique({
    where:{ user_name: context.userId.userId },
  });
  return result;
}

export default {
  getNowUser,
};
