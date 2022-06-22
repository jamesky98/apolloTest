/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_project(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.ref_id) {
    return null;
  }
  const result = await context.prisma.ref_project.findUnique({
    where: { id: parent.ref_id },
  });
  return result;
}

module.exports = {
  ref_project,
};
