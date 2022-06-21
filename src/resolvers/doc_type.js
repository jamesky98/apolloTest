async function doc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.doc.findMany({
    where: { doc_type: parent.doc_type_id },
  });
}

module.exports = {
  doc,
};
