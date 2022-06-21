/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function cus_org(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.org_id) {
    return null;
  }
  const item_type = await context.prisma.cus_org.findUnique({
    where: { id: parent.org_id },
  });
  return item_type;
}

module.exports = {
  cus_org,
};
