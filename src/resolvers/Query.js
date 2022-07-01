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
async function getDocHistory(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const where = { doc_id: args.doc_id };

  const result = await context.prisma.doc.findMany({
    where,
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocChild(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const where = { 
    parent_id: {
      contains: args.doc_id
    }
  };

  const result = await context.prisma.doc.findMany({
    where,
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocbyID(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const where = { id: args.id };

  const result = await context.prisma.doc.findUnique({
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

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCasebyID(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });
}

module.exports = {
  allusers,
  getAllDoc,
  getAllDocLatest,
  getDocHistory,
  getDocChild,
  getDocbyID,
  getAllCase,
  getCasebyID,
};
