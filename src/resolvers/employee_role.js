/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_empower(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.role_type) {
    return null;
  }
  const result = await context.prisma.employee_empower.findMany({
    where: { role_type: parent.role_type },
  });
  return result;
}

module.exports = {
  employee_empower,
};
