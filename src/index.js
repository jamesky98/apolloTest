const {ApolloServer} = require('apollo-server');
const { typeDefs: scalarTypeDefs } = require("graphql-scalars");
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require("@prisma/client");

// resolvers
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");


const prisma = new PrismaClient();

const resolvers = {
  Query,
  Mutation,
};

const server = new ApolloServer({
  typeDefs: [
    ...scalarTypeDefs,
    fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  ],
  resolvers,
  context: {
    prisma,
  },
});

server
  .listen()
  .then(({url}) => console.log(`Server is running on ${url}`));
