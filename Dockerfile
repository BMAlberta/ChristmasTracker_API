FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ARG MONGO_INITDB_ROOT_USERNAME
ENV MONGO_INITDB_ROOT_USERNAME=$MONGO_INITDB_ROOT_USERNAME
ARG MONGO_INITDB_ROOT_PASSWORD
ENV MONGO_INITDB_ROOT_PASSWORD=$MONGO_INITDB_ROOT_PASSWORD
ARG AUTH_TYPE
ARG TOKEN_SECRET
ARG EXPIRY_TIME
ENV AUTH_TYPE=$AUTH_TYPE
ENV TOKEN_SECRET=$TOKEN_SECRET
ENV EXPIRY_TIME=$EXPIRY_TIME
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
EXPOSE 3000
CMD [ "node", "server.js" ]
