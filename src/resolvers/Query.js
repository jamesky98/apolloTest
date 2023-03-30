/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
import { chkUserId } from "../utils.js";

async function getNowUser(parent, args, context) {
  const result = await context.prisma.user.findUnique({
    where:{ user_name: context.userId.userId },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCaseStatus(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.case_status.findMany();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCaseCalType(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.cal_type.findMany();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllOrg(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus_org.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getUniItemChop(parent, args, context) {
  if (chkUserId(context)){
    let result = await context.prisma.item_base.findMany({
      select:{chop: true},
      distinct: ['chop'],
      orderBy: {
        chop: 'asc',
      },
    })
    return result.map(x=>{
      return x.chop
    })
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getUniItemModel(parent, args, context) {
  if (chkUserId(context)){
    const result = await context.prisma.item_base.findMany({
      select:{model: true},
      distinct: ['model'],
      orderBy: {
        model: 'asc',
      },
    })
    return result.map(x=>{
      return x.model
    })
  }
}

export default {
  getNowUser,
  getCaseStatus,
  getCaseCalType,
  getAllOrg,
  getUniItemChop,
  getUniItemModel,
};
