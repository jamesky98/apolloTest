import {
  case_base,
  ref_project,
  employee_case_record_01_chk_person_idToemployee as employee_case_record_02_chk_person_idToemployee,
  employee_case_record_01_sign_person_idToemployee as employee_case_record_02_sign_person_idToemployee,
} from "./case_record_01";

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

export default {
  case_base,
  item_base_case_record_02_gnss_idToitem_base,
  item_base_case_record_02_imu_idToitem_base,
  ref_project,
  employee_case_record_02_chk_person_idToemployee,
  employee_case_record_02_sign_person_idToemployee,
};
