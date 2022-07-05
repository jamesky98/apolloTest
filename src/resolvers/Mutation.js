/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { APP_SECRET, getUserId } = require("../utils");

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function signup(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.user_password, 10);

  // 2
  const user = await context.prisma.user.create({
    data: { ...args, user_password: password },
  });

  // 3
  const token = jwt.sign({ userId: user.user_name }, APP_SECRET);

  // 4
  return {
    token,
    user,
  };
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function login(parent, args, context, info) {
  // 1
  const user = await context.prisma.user.findUnique({
    where: { user_name: args.user_name },
  });
  if (!user) {
    throw new Error("No such user found");
  }

  // 2
  const valid = await bcrypt.compare(args.user_password, user.user_password);
  if (!valid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ userId: user.user_name }, APP_SECRET);

  // 3
  return {
    token,
    user,
  };
}

function chkUserId(context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function creatDoc(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.doc.create({
    data: { ...args},
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delDoc(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.doc.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateDoc(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.doc.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function creatCase(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.case_base.create({
    data: {
      id: args.id,
      cal_type: args.cal_type,
    },
  });

  switch (args.cal_type) {
    case 1:
    case 3:
      // 航測像機
      if (!args.cam_type){throw new Error("Invalid cam_type!!");}
      const record_01 = await context.prisma.case_record_01.create({
        data: {
          id: args.id,
          cam_type: args.cam_type,
        },
      });
      break;
    case 2:
      // 空載光達
      const record_02 = await context.prisma.case_record_02.create({
        data: { id: args.id },
      });
      break;
    default:
      throw new Error("Invalid cal_type!!");
  }
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delCase(parent, args, context) {
  chkUserId(context);
  const getcase = await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });

  switch (getcase.cal_type) {
    case 1:
    case 3:
      // 航測像機
      const record01 = await context.prisma.case_record_01.delete({
        where: { id: args.id },
      });
      break;
    case 2:
      // 空載光達
      const record02 = await context.prisma.case_record_02.delete({
        where: { id: args.id },
      });
      break;
  }
  const result = await context.prisma.case_base.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateCase(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.case_base.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRecord01(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.case_record_01.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRecord02(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.case_record_02.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createItem(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.item_base.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delItem(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.item_base.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateItem(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.item_base.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createItemType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.item_type.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delItemType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.item_type.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateItemType(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.item_type.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createCust(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.cus.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delCust(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.cus.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateCust(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.cus.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createOrg(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.cus_org.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delOrg(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.cus_org.delete({
    where: { id: args.id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateOrg(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.cus_org.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmp(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmp(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee.delete({
    where: { person_id: args.person_id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateEmp(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.employee.update({
    where: { person_id: args.person_id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmpRole(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_role.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmpRole(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_role.delete({
    where: { role_type: args.role_type },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createEmpower(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_empower.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delEmpower(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_empower.delete({
    where: { empower_id: args.empower_id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateEmpower(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.empower_id;
  const result = await context.prisma.employee_empower.update({
    where: { empower_id: args.empower_id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createTrain(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_train.create({
    data: { ...args },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delTrain(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.employee_train.delete({
    where: { train_id: args.train_id },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateTrain(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.train_id;
  const result = await context.prisma.employee_train.update({
    where: { train_id: args.train_id },
    data: { ...tempArgs },
  });

  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefPrj(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_project.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefPrj(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_project.delete({
    where: { id: args.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefPrj(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.ref_project.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function addPrjEqptKey(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_use_eqpt.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function removePrjEqptKey(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_use_eqpt.delete({
    where: { id: args.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updatePrjEqptKey(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;

  const hasKey = await context.prisma.ref_project.count({
    where: {
      AND: { project_id: args.project_id, eqpt_check_id: args.eqpt_check_id },
    },
  });

  if (hasKey > 0) {
    throw new Error("data duplication!!");
  } else {
    const result = await context.prisma.ref_project.update({
      where: { id: args.id },
      data: { ...tempArgs },
    });
  }
  return result;  
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqpt(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqpt(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt.delete({
    where: { ref_equpt_id: args.ref_equpt_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqpt(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.ref_equpt_id;
  const result = await context.prisma.ref_eqpt.update({
    where: { ref_equpt_id: args.ref_equpt_id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqptType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt_type.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqptType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt_type.delete({
    where: { eqpt_type_id: args.eqpt_type_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqptType(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.eqpt_type_id;
  const result = await context.prisma.ref_eqpt.update({
    where: { eqpt_type_id: args.eqpt_type_id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createRefEqptChk(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt_check.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delRefEqptChk(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.ref_eqpt_check.delete({
    where: { eq_ck_id: args.eq_ck_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateRefEqptChk(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.eq_ck_id;
  const result = await context.prisma.ref_eqpt_check.update({
    where: { eq_ck_id: args.eq_ck_id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGCP(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGCP(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp.delete({
    where: { id: args.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGCP(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.gcp.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpRecord(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_record.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpRecord(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_record.delete({
    where: { id: args.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpRecord(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.gcp_record.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_type.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpType(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_type.delete({
    where: { code: args.code },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpType(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.code;
  const result = await context.prisma.gcp_type.update({
    where: { code: args.code },
    data: { ...tempArgs },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function createGcpContact(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_contact.create({
    data: { ...args },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function delGcpContact(parent, args, context) {
  chkUserId(context);
  const result = await context.prisma.gcp_contact.delete({
    where: { id: args.id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function updateGcpContact(parent, args, context) {
  chkUserId(context);
  let tempArgs = { ...args };
  delete tempArgs.id;
  const result = await context.prisma.gcp_contact.update({
    where: { id: args.id },
    data: { ...tempArgs },
  });
  return result;
}

module.exports = {
  signup,
  login,
  creatDoc,
  delDoc,
  updateDoc,
  creatCase,
  delCase,
  updateCase,
  updateRecord01,
  updateRecord02,
  createItem,
  delItem,
  updateItem,
  createItemType,
  delItemType,
  updateItemType,
  createCust,
  delCust,
  updateCust,
  createOrg,
  delOrg,
  updateOrg,
  createEmp,
  delEmp,
  updateEmp,
  createEmpRole,
  delEmpRole,
  createEmpower,
  delEmpower,
  updateEmpower,
  createTrain,
  delTrain,
  updateTrain,
  createRefPrj,
  delRefPrj,
  updateRefPrj,
  addPrjEqptKey,
  removePrjEqptKey,
  updatePrjEqptKey,
  createRefEqpt,
  delRefEqpt,
  updateRefEqpt,
  createRefEqptType,
  delRefEqptType,
  updateRefEqptType,
  createRefEqptChk,
  delRefEqptChk,
  updateRefEqptChk,
  createGCP,
  delGCP,
  updateGCP,
  createGcpRecord,
  delGcpRecord,
  updateGcpRecord,
  createGcpType,
  delGcpType,
  updateGcpType,
  createGcpContact,
  delGcpContact,
  updateGcpContact,
};
