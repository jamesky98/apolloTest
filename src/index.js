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
const case_apply_01 = require("./resolvers/case_apply_01");
const case_apply_02 = require("./resolvers/case_apply_02");
const item_base = require("./resolvers/item_base");
const cus = require("./resolvers/cus");

const resolvers = {
  Query,
  Mutation,
  doc,
  doc_type,
  case_base,
  case_apply_01,
  case_apply_02,
  item_base,
  cus,
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
