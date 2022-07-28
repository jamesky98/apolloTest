/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function doc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.doc.findMany({
    where: { doc_type: parent.doc_type_id },
  });
}

export default {
  doc,
};
