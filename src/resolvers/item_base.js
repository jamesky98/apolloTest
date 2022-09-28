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

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
 async function case_base(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.case_base.findMany({
    where: { item_id: parent.id },
  });
  return result;
}

export default {
  item_type,
  case_base,
};
