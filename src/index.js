/**
 * @typedef { import("@prisma/client").PrismaClient } Prisma
 */
// apollo server
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageDisabled
} from "apollo-server-core";
import express from "express";
import cors from "cors";
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
import { print } from 'graphql';

// utiles
import { getUserId } from "./utils.js";

// resolvers
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";
import doc from "./resolvers/doc.js";
import doc_type from "./resolvers/doc_type.js";
import case_base from "./resolvers/case_base.js";
import case_record_01 from "./resolvers/case_record_01.js";
import case_record_02 from "./resolvers/case_record_02.js";
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
// import * as dotenv from 'dotenv'
// const envcontent = dotenv.config();
// console.log('env:',process.env);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("WorkPath: ", __dirname);

const resolvers = {
  Query,
  Mutation,
  doc,
  doc_type,
  case_base,
  case_record_01,
  case_record_02,
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

const BASIC_LOGGING = {
  requestDidStart(requestContext) {
    console.log("request started");
    console.log(requestContext.request.query);
    console.log(requestContext.request.variables);
    return {
      didEncounterErrors(requestContext) {
          console.log("an error happened in response to query " + requestContext.request.query);
          console.log(requestContext.errors);
      },
      willSendResponse(requestContext) {
        console.log("response sent", requestContext.response);
      }
    };
  },
};

const typeDefs = [
      ...scalarTypeDefs,
      fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
    ];

async function startApolloServer(typeDefs, resolvers) {
  // console.log("NODE_ENV",process.env.NODE_ENV);
  const app = express();
  const corsOptions = {
    // origin: 'http://10.140.170.*',
    origin: '*',
    methods: 'GET,HEAD,POST,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
  app.use(cors(corsOptions));
  // app.use(cors());
  app.use('/public', express.static(path.join(__dirname, process.env.PUBLIC_PATH)));
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
      // 紀錄日誌
      // BASIC_LOGGING,
      // 與Express server集成
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // 設定初始頁面為Apollo Sandbox
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      // 取消初始頁面為Apollo Sandbox
      // ApolloServerPluginLandingPageDisabled(),
    ],
    // introspection: false,
    nodeEnv: 'development' // development || production
  });

  await server.start();
  server.applyMiddleware({
    app,
    path: "/",
  });

  await new Promise(resolve => httpServer.listen({ port: process.env.PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);

}

startApolloServer(typeDefs,resolvers);
