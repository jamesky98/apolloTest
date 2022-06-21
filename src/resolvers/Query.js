
async function allusers(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.user.findMany();
}

async function getalldoc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.doc.findMany();
}

async function getAllCase(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_base.findMany();
}

module.exports = {
  allusers,
  getalldoc,
  getAllCase,
};
