FROM node:16-alpine
WORKDIR /apollotest
COPY *.* /apollotest/
COPY /src /apollotest/src
COPY /prisma /apollotest/prisma
RUN yarn install
ENV DATABASE_URL mysql://root:Nlsc!1234567@127.0.0.1:3306/sicl_db
RUN npx prisma generate
CMD ["node", "src/index.js"]
EXPOSE 4000