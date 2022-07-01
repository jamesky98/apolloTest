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

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function creatDoc(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }

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
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }

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
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
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
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
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
      const apply_01 = await context.prisma.case_apply_01.create({
        data: {
          id: args.id,
          cam_type: args.cam_type,
        },
      });

      const report_01 = await context.prisma.case_report_01.create({
        data: { id: args.id },
      });
      break;
    case 2:
      // 空載光達
      const apply_02 = await context.prisma.case_apply_02.create({
        data: { id: args.id },
      });

      const report_02 = await context.prisma.case_report_02.create({
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
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }

  const getcase = await context.prisma.case_base.findUnique({
    where: { id: args.id },
  });


  switch (getcase.cal_type) {
    case 1:
    case 3:
      // 航測像機
      const apply01 = await context.prisma.case_apply_01.delete({
        where: { id: args.id },
      });
      const report01 = await context.prisma.case_report_01.delete({
        where: { id: args.id },
      });
      break;
    case 2:
      // 空載光達
      const apply02 = await context.prisma.case_apply_02.delete({
        where: { id: args.id },
      });
      const report02 = await context.prisma.case_report_02.delete({
        where: { id: args.id },
      });
      break;
  }
  const result = await context.prisma.case_base.delete({
    where: { id: args.id },
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
};
