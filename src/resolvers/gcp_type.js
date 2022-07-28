/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function gcp(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.code) {
    return null;
  }
  const result = await context.prisma.gcp_record.findMany({
    where: { type_code: parent.code },
  });
  return result;
}

export default {
  gcp,
};
