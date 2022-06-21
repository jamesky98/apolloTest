
async function feed(parent, args, context) {
  return await context.prisma.user.findMany();
}

module.exports = {
  feed,
};
