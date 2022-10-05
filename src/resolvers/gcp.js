/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
// async function gcp_record(parent, args, context) {
//   const { userId } = context;
//   if (!userId) {
//     throw new Error("Invalid user!!");
//   }
//   if (!parent.id) {
//     return null;
//   }
//   const result = await context.prisma.gcp_record.findMany({
//     where: { gcp_id: parent.id },
//   });
//   return result;
// }

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

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function latest_record(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.gcp_record.findMany({
    where: { gcp_id: parent.id },
    orderBy: { date: 'desc', },
    take: 1,
  });
  return result[0];
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function latest_coor(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.id) {
    return null;
  }
  const result = await context.prisma.gcp_record.findMany({
    where: {
      AND:{
        gcp_id: parent.id,
        NOT: {
          OR:[{coor_E: null},{coor_E: 0}] ,
          OR:[{coor_N: null},{coor_N: 0}] ,
          OR:[{coor_h: null},{coor_h: 0}] ,
        }
      }},
    orderBy: { date: 'desc', },
    take: 1,
  });
  return result[0];
}

export default {
  // gcp_record,
  gcp_type,
  gcp_contact,
  latest_record,
  latest_coor,
};
