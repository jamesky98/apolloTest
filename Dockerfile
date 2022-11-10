FROM node:16-alpine
WORKDIR /apollotest
COPY *.* /apollotest/
COPY /src /apollotest/src
COPY /prisma /apollotest/prisma
RUN yarn install
RUN npm i -g npm
ENV DATABASE_URL mysql://root:Nlsc!1234567@127.0.0.1:3306/sicl_db
RUN npx prisma generate
# CMD ["node", "src/index.js"]
CMD npm run publish
EXPOSE 4000