/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
// apollo server
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import express from "express";
import http from "http";

// file and path
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// graphql and prisma
import { typeDefs as scalarTypeDefs } from "graphql-scalars";
import { PrismaClient } from "@prisma/client";
// graphql-upload
import GraphQLUpload from "../node_modules/graphql-upload/GraphQLUpload.mjs";
import graphqlUploadExpress from "../node_modules/graphql-upload/graphqlUploadExpress.mjs";

// utiles
import { getUserId } from "./utils.js";

// resolvers
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";
import doc from "./resolvers/doc.js";
import doc_type from "./resolvers/doc_type.js";
import case_base from "./resolvers/case_base.js";
import item_base from "./resolvers/item_base.js";
import cus from "./resolvers/cus.js";
import employee from "./resolvers/employee.js";
import ref_project from "./resolvers/ref_project.js";
import gcp_record from "./resolvers/gcp_record.js";
import gcp from "./resolvers/gcp.js";
import gcp_type from "./resolvers/gcp_type.js";
import gcp_contact from "./resolvers/gcp_contact.js";
import ref_use_eqpt from "./resolvers/ref_use_eqpt.js";
import ref_eqpt_check from "./resolvers/ref_eqpt_check.js";
import ref_eqpt from "./resolvers/ref_eqpt.js";
import ref_eqpt_type from "./resolvers/ref_eqpt_type.js";
import employee_empower from "./resolvers/employee_empower.js";
import employee_role from "./resolvers/employee_role.js";
import employee_train from "./resolvers/employee_train.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname);

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
  Upload: GraphQLUpload,
};

const prisma = new PrismaClient();

const typeDefs = [
      ...scalarTypeDefs,
      fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
    ];

async function startApolloServer(typeDefs, resolvers) {
  const app = express();
  app.use(graphqlUploadExpress());
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      return {
        ...req,
        prisma,
        userId: req && req.headers.authorization ? getUserId(req) : null,
      };
    },
    csrfPrevention: true,
    cache: "bounded",
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: "/",
  });

  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);

}

startApolloServer(typeDefs,resolvers);
