/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.employee.findUnique({
    where: { person_id: parent.person_id },
  });
  return result;
}

module.exports = {
  employee,
};
