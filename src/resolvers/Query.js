/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function allusers(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.user.findMany();
}
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDoc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.doc.findMany();
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDocLatest(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  let filter = [];
  for (let key in args) {
    if (args[key]) {
      console.log(key);
      console.log(args[key]);
      let myObj = new Object();
      myObj[key] = args[key];
      filter.push(myObj);
      
    }
  }
  const where = { AND: filter };

  const result = await context.prisma.doc_latest.findMany({
    where,
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCase(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_base.findMany();
}

module.exports = {
  allusers,
  getAllDoc,
  getAllDocLatest,
  getAllCase,
};
