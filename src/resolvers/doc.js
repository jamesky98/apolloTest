/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function doc_type_docTodoc_type(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const doctype = await context.prisma.doc_type.findUnique({
    where: { doc_type_id: parent.doc_type },
  });
  return doctype;
}

export default {
  doc_type_docTodoc_type,
};
