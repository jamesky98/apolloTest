/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function item_type(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.type) {
    return null;
  }
  const item_type = await context.prisma.item_type.findUnique({
    where: { id: parent.type },
  });
  return item_type;
}

module.exports = {
  item_type,
};
