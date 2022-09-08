import record01 from "./case_record_01.js";

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function item_base_case_record_02_gnss_idToitem_base(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.gnss_id) {
    return null;
  }
  return await context.prisma.item_base.findUnique({
    where: { id: parent.gnss_id },
  });
}

/**
 * @param {any} parent
 * @param {{ prisma: Prisma }} context
 */
async function item_base_case_record_02_imu_idToitem_base(
  parent,
  args,
  context
) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.imu_id) {
    return null;
  }
  return await context.prisma.item_base.findUnique({
    where: { id: parent.imu_id },
  });
}

async function case_base(parent, args, context){
  return record01.case_base(parent, args, context);
}

async function ref_project(parent, args, context) {
  return record01.ref_project(parent, args, context);
}

async function employee_case_record_02_chk_person_idToemployee(
  parent,
  args,
  context
) {
  return record01.employee_case_record_01_chk_person_idToemployee(
    parent,
    args,
    context
  );
}

async function employee_case_record_02_sign_person_idToemployee(
  parent,
  args,
  context
) {
  return record01.employee_case_record_01_sign_person_idToemployee(
    parent,
    args,
    context
  );
}

export default {
  item_base_case_record_02_gnss_idToitem_base,
  item_base_case_record_02_imu_idToitem_base,
  case_base,
  ref_project,
  employee_case_record_02_chk_person_idToemployee,
  employee_case_record_02_sign_person_idToemployee,
};
