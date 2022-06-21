/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function allusers(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.user.findMany();
}
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getalldoc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.doc.findMany();
}
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCase(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_base.findMany();
}

module.exports = {
  allusers,
  getalldoc,
  getAllCase,
};
