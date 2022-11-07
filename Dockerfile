FROM node:16
WORKDIR /apollotest
COPY *.* /apollotest/
COPY /src /apollotest/src
COPY /prisma /apollotest/prisma
RUN yarn install
RUN npx prisma generate
CMD ["node", "src/index.js"]
EXPOSE 4000