FROM node:20-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
COPY ./package.json /usr/src/app/
RUN npm install
COPY ./src /usr/src/app
EXPOSE 3000
CMD [ "node", "--experimental-loader=newrelic/esm-loader.mjs", "index.mjs" ]
