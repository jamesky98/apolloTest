/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_eqpt(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.eqpt_type_id) {
    return null;
  }
  const result = await context.prisma.ref_eqpt.findMany({
    where: { type: parent.eqpt_type_id },
  });
  return result;
}

module.exports = {
  ref_eqpt,
};
