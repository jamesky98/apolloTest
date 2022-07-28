/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_eqpt_type(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.type) {
    return null;
  }
  const result = await context.prisma.ref_eqpt_type.findUnique({
    where: { eqpt_type_id: parent.type },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_eqpt_check(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.ref_equpt_id) {
    return null;
  }
  const result = await context.prisma.ref_eqpt_check.findMany({
    where: { ref_eqpt_id: parent.ref_equpt_id },
  });
  return result;
}

export default {
  ref_eqpt_type,
  ref_eqpt_check,
};
