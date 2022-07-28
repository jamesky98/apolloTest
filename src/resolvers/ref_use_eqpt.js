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
  if (!parent.project_id) {
    return null;
  }
  const result = await context.prisma.ref_project.findUnique({
    where: { id: parent.project_id },
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
  if (!parent.eqpt_check_id) {
    return null;
  }
  const result = await context.prisma.ref_eqpt_check.findUnique({
    where: { eq_ck_id: parent.eqpt_check_id },
  });
  return result;
}

export default {
  ref_project,
  ref_eqpt_check,
};
