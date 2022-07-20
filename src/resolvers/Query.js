/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */

const { APP_SECRET, chkUserId } = require("../utils");

async function checktoken(parent, args, context) {
  return chkUserId(context);;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function allusers(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.user.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getUserById(parent, args, context) {
  if (chkUserId(context)){
  const where = { user_id: args.user_id };

  const result = await context.prisma.user.findUnique({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDoc(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.doc.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDocLatest(parent, args, context) {
  if (chkUserId(context)){
  let filter = [];
  for (let key in args) {
    if (args[key]) {
      let myObj = new Object();
      switch (key) {
        case "stauts":
          switch (args.stauts) {
            case 1:
              filter.push({ expiration_date: null });
              break;
            case 2:
              filter.push({ NOT: [{ expiration_date: null }] });
              break;
          }
          break;
        case "name":
        case "ver":
          myObj[key] = { contains: args[key] };
          filter.push(myObj);
          break;
        default:
          myObj[key] = args[key];
          filter.push(myObj);
      }
    }
  }
  const where = { AND: filter };
  const result = await context.prisma.doc_latest.findMany({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocHistory(parent, args, context) {
  if (chkUserId(context)){
  const where = { doc_id: args.doc_id };

  const result = await context.prisma.doc.findMany({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocChild(parent, args, context) {
  if (chkUserId(context)){
  const where = { 
    parent_id: {
      contains: args.doc_id
    }
  };

  const result = await context.prisma.doc.findMany({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getDocbyID(parent, args, context) {
  if (chkUserId(context)){
  const where = { id: args.id };

  const result = await context.prisma.doc.findUnique({
    where,
  });

  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllDocType(parent, args, context) {
  if (chkUserId(context)) {
    return await context.prisma.doc_type.findMany();
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCase(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.case_base.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCasebyID(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllCust(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getCustById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus.findUnique({
    where: { id: args.id },
  });}
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
async function getOrgById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.cus_org.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllEmp(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.employee.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEmpById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.employee.findUnique({
    where: { person_id: args.person_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEmpowerByPerson(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.employee_empower.findMany({
    where: { person_id: args.person_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getTrainByPerson(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.employee_train.findMany({
    where: { person_id: args.person_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllPrj(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_project.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getPrjById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_project.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordsByPrj(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findMany({
    where: { project_id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getEqptByPrj(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.ref_use_eqpt.findMany({
    where: { project_id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllGcpLatest(parent, args, context) {
  if (chkUserId(context)){
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
  return result;}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordsByGCPId(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findMany({
    where: { gcp_id: args.gcp_id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGcpRecordById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_record.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getAllContact(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_contact.findMany();}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getContactById(parent, args, context) {
  if (chkUserId(context)){
  return await context.prisma.gcp_contact.findUnique({
    where: { id: args.id },
  });}
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function getGCPsByContact(parent, args, context) {
  if (chkUserId(context)){
    return await context.prisma.gcp.findMany({
      where: { contact_id: args.id },
    });
  }
}

module.exports = {
  checktoken,
  allusers,
  getUserById,
  getAllDoc,
  getAllDocLatest,
  getDocHistory,
  getDocChild,
  getDocbyID,
  getAllDocType,
  getAllCase,
  getCasebyID,
  getAllCust,
  getCustById,
  getAllOrg,
  getOrgById,
  getAllEmp,
  getEmpById,
  getEmpowerByPerson,
  getTrainByPerson,
  getAllPrj,
  getPrjById,
  getGcpRecordsByPrj,
  getEqptByPrj,
  getAllGcpLatest,
  getGcpById,
  getGcpRecordsByGCPId,
  getGcpRecordById,
  getAllContact,
  getContactById,
  getGCPsByContact,
};
