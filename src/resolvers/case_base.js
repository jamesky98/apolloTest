async function case_apply_01(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_apply_01.findUnique({
    where: { id: parent.id },
  });
}

async function case_apply_02(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  return await context.prisma.case_apply_02.findUnique({
    where: { id: parent.id },
  });
}

async function case_status(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const case_status = await context.prisma.case_status.findUnique({
    where: { code: parent.status_code },
  });
  return case_status;
}

async function cus(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const cus = await context.prisma.cus.findUnique({
    where: { id: parent.cus_id },
  });
  return cus;
}

async function cal_type_cal_typeTocase_base(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  const cal_type = await context.prisma.cal_type.findUnique({
    where: { id: parent.cal_type },
  });
  return cal_type;
}

async function item_base(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.item_id) {
    return null;
  }
  const item = await context.prisma.item_base.findUnique({
    where: { id: parent.item_id },
  });
  return item;
}

async function employee_case_base_leader_idToemployee(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.leader_id) {
    return null;
  }
  const leader = await context.prisma.employee.findUnique({
    where: { person_id: parent.leader_id },
  });
  return leader;
}

async function employee_case_base_operators_idToemployee(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if(!parent.operators_id) {
    return null; 
  }
  const operator = await context.prisma.employee.findUnique({
    where: { person_id: parent.operators_id },
  });
  return operator;
}

module.exports = {
  case_apply_01,
  case_apply_02,
  case_status,
  cus,
  cal_type_cal_typeTocase_base,
  item_base,
  employee_case_base_leader_idToemployee,
  employee_case_base_operators_idToemployee,
};
