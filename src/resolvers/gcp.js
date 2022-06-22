/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
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
    where: { gcp_id: parent.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function gcp_type(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.type_code) {
    return null;
  }
  const result = await context.prisma.gcp_type.findUnique({
    where: { code: parent.type_code },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function gcp_contact(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.contact_id) {
    return null;
  }
  const result = await context.prisma.gcp_contact.findUnique({
    where: { id: parent.contact_id },
  });
  return result;
}

module.exports = {
  gcp_record,
  gcp_type,
  gcp_contact,
};
