/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.person_id) {
    return null;
  }
  const result = await context.prisma.employee.findUnique({
    where: { person_id: parent.person_id },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function cal_type_cal_typeToemployee_empower(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.cal_type) {
    return null;
  }
  const result = await context.prisma.cal_type.findUnique({
    where: { id: parent.cal_type },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_role(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.role_type) {
    return null;
  }
  const result = await context.prisma.employee_role.findUnique({
    where: { role_type: parent.role_type },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_employeeToemployee_empower_assessor(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.assessor) {
    return null;
  }
  const result = await context.prisma.employee.findUnique({
    where: { person_id: parent.assessor },
  });
  return result;
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function employee_employeeToemployee_empower_lab_supervisor(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.lab_supervisor) {
    return null;
  }
  const result = await context.prisma.employee.findUnique({
    where: { person_id: parent.lab_supervisor },
  });
  return result;
}

export default {
  employee,
  cal_type_cal_typeToemployee_empower,
  employee_role,
  employee_employeeToemployee_empower_assessor,
  employee_employeeToemployee_empower_lab_supervisor,
};
