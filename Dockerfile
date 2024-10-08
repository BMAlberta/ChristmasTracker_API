FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# ARG MONGO_INITDB_ROOT_USERNAME
# ENV MONGO_INITDB_ROOT_USERNAME=$MONGO_INITDB_ROOT_USERNAME
# ARG MONGO_INITDB_ROOT_PASSWORD
# ENV MONGO_INITDB_ROOT_PASSWORD=$MONGO_INITDB_ROOT_PASSWORD
# ARG DATABASE_URL
# ENV DATABASE_URL=$DATABASE_URL
# ARG DATABASE_URI_SCHEME
# ENV DATABASE_URI_SCHEME=$DATABASE_URI_SCHEME
# ARG DATABASE_URI_HOST
# ENV DATABASE_URI_HOST=$DATABASE_URI_HOST
# ARG SESSION_SECRET
# ARG OTP_ENCRYPTION_SECRET
# ARG BASIC_ENROLLMENT_ACCESS_KEY
# ARG SESSION_SECRET=$SESSION_SECRET
# ARG OTP_ENCRYPTION_SECRET=$OTP_ENCRYPTION_SECRET
# ARG BASIC_ENROLLMENT_ACCESS_KEY=$BASIC_ENROLLMENT_ACCESS_KEY
# ARG DATABASE_CONNECTION_STRING
# ENV DATABASE_CONNECTION_STRING=$DATABASE_CONNECTION_STRING
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
COPY ./package.json /usr/src/app/
RUN npm install
COPY ./src /usr/src/app
EXPOSE 3000
CMD [ "node", "index.mjs" ]
