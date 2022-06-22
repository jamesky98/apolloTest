/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function case_base_case_base_leader_idToemployee(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.case_base.findMany({
    where: { leader_id: parent.person_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function case_base_case_base_operators_idToemployee(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.case_base.findMany({
    where: { operators_id: parent.person_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_empower(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.employee_empower.findMany({
    where: { person_id: parent.person_id },
  });
  return result;
}

async function employee_train(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.employee_empower.findMany({
    where: { person_id: parent.person_id },
  });
  return result;
}

module.exports = {
  case_base_case_base_leader_idToemployee,
  case_base_case_base_operators_idToemployee,
  employee_empower,
  employee_train,
};
