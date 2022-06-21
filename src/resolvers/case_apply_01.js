async function cam_type_cam_typeTocase_apply_01(parent, args, context) {
  const { userId } = context;
  if (!userId) {
    throw new Error("Invalid user!!");
  }
  if (!parent.cam_type) {
    return null;
  }
  const cam_type = await context.prisma.cam_type.findUnique({
    where: { id: parent.cam_type },
  });
  return cam_type;
}

module.exports = {
  cam_type_cam_typeTocase_apply_01,
};
