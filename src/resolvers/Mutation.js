/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { APP_SECRET, getUserId } = require("../utils");

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function signup(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.user_password, 10);

  // 2
  const user = await context.prisma.user.create({
    data: { ...args, user_password: password },
  });

  // 3
  const token = jwt.sign({ userId: user.user_name }, APP_SECRET);

  // 4
  return {
    token,
    user,
  };
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function login(parent, args, context, info) {
  // 1
  const user = await context.prisma.user.findUnique({
    where: { user_name: args.user_name },
  });
  if (!user) {
    throw new Error("No such user found");
  }

  // 2
  const valid = await bcrypt.compare(args.user_password, user.user_password);
  if (!valid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ userId: user.user_name }, APP_SECRET);

  // 3
  return {
    token,
    user,
  };
}

module.exports = {
  signup,
  login,
};
