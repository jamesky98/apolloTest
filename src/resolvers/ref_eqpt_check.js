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
  if (!parent.ref_eqpt_id) {
    return null;
  }
  const result = await context.prisma.ref_eqpt.findUnique({
    where: { ref_equpt_id: parent.ref_eqpt_id },
  });
  return result;
}

export default {
  ref_eqpt,
};
