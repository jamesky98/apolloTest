/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function cal_type(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.cal_type_id) {
    return null;
  }
  const result = await context.prisma.cal_type.findUnique({
    where: { id: parent.cal_type_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function gcp_record(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.gcp_record.findMany({
    where: { project_id: parent.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_use_eqpt(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.ref_use_eqpt.findMany({
    where: { project_id: parent.id },
  });
  return result;
}

module.exports = {
  cal_type,
  gcp_record,
  ref_use_eqpt,
};
