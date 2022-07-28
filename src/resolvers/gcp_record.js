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
  if (!parent.gcp_id) {
    return null;
  }
  const result = await context.prisma.gcp.findUnique({
    where: { id: parent.gcp_id },
  });
  return result;
}

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

export default {
  gcp,
  ref_project,
};
