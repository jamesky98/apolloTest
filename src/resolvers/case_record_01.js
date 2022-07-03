/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function case_base(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_base.findUnique({
    where: { id: parent.id },
  });
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function cam_type_cam_typeTocase_record_01(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.cam_type) {
    return null;
  }
  return await context.prisma.cam_type.findUnique({
    where: { id: parent.cam_type },
  });
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function ref_project(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.ref_id) {
    return null;
  }
  return await context.prisma.ref_project.findUnique({
    where: { id: parent.ref_id },
  });
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_case_record_01_chk_person_idToemployee(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.chk_person_id) {
    return null;
  }
  return await context.prisma.employee.findUnique({
    where: { person_id: parent.chk_person_id },
  });
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_case_record_01_sign_person_idToemployee(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.sign_person_id) {
    return null;
  }
  return await context.prisma.employee.findUnique({
    where: { person_id: parent.sign_person_id },
  });
}

module.exports = {
  case_base,
  cam_type_cam_typeTocase_record_01,
  ref_project,
  employee_case_record_01_chk_person_idToemployee,
  employee_case_record_01_sign_person_idToemployee,
};
