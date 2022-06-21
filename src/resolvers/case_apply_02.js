async function item_base_case_apply_02_gnss_idToitem_base(
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
  const gnss = await context.prisma.item_base.findUnique({
    where: { id: parent.gnss_id },
  });
  return gnss;
}

async function item_base_case_apply_02_imu_idToitem_base(
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
  const imu = await context.prisma.item_base.findUnique({
    where: { id: parent.imu_id },
  });
  return imu;
}

module.exports = {
  item_base_case_apply_02_gnss_idToitem_base,
  item_base_case_apply_02_imu_idToitem_base,
};
