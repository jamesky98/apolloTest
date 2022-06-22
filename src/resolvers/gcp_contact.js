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
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.gcp.findMany({
    where: { contact_id: parent.id },
  });
  return result;
}

module.exports = {
  gcp,
};
