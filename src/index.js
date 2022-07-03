/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
const {ApolloServer} = require('apollo-server');
const { typeDefs: scalarTypeDefs } = require("graphql-scalars");
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require("@prisma/client");
const { getUserId } = require("./utils");

// resolvers
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const doc = require("./resolvers/doc");
const doc_type = require("./resolvers/doc_type");
const case_base = require("./resolvers/case_base");
// const case_apply_01 = require("./resolvers/case_apply_01");
// const case_apply_02 = require("./resolvers/case_apply_02");
const item_base = require("./resolvers/item_base");
const cus = require("./resolvers/cus");
const employee = require("./resolvers/employee");
// const case_report_01 = require("./resolvers/case_report_01");
// const case_report_02 = require("./resolvers/case_report_02");
const ref_project = require("./resolvers/ref_project");
const gcp_record = require("./resolvers/gcp_record");
const gcp = require("./resolvers/gcp");
const gcp_type = require("./resolvers/gcp_type");
const gcp_contact = require("./resolvers/gcp_contact");
const ref_use_eqpt = require("./resolvers/ref_use_eqpt");
const ref_eqpt_check = require("./resolvers/ref_eqpt_check");
const ref_eqpt = require("./resolvers/ref_eqpt");
const ref_eqpt_type = require("./resolvers/ref_eqpt_type");
const employee_empower = require("./resolvers/employee_empower");
const employee_role = require("./resolvers/employee_role");
const employee_train = require("./resolvers/employee_train");

const resolvers = {
  Query,
  Mutation,
  doc,
  doc_type,
  case_base,
  // case_apply_01,
  // case_apply_02,
  item_base,
  cus,
  employee,
  // case_report_01,
  // case_report_02,
  ref_project,
  gcp_record,
  gcp,
  gcp_type,
  gcp_contact,
  ref_use_eqpt,
  ref_eqpt_check,
  ref_eqpt,
  ref_eqpt_type,
  employee_empower,
  employee_role,
  employee_train,
};

const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs: [
    ...scalarTypeDefs,
    fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  ],
  resolvers,
  context: ({ req }) => {
    return {
      ...req,
      prisma,
      userId: req && req.headers.authorization ? getUserId(req) : null,
    };
  },
});

server
  .listen()
  .then(({url}) => console.log(`Server is running on ${url}`));
