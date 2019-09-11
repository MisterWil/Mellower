FROM node:lts

LABEL maintainer="misterwil* <wilrader@gmail.com>"

USER root

ENV APP /usr/src/app

RUN npm install pm2 -g

COPY package.json /tmp/package.json

RUN cd /tmp && npm install --loglevel=warn \
  && mkdir -p $APP \
  && mv /tmp/node_modules $APP

COPY src $APP/src
COPY migrations $APP/migrations

WORKDIR $APP

EXPOSE 5060

CMD [ "pm2-runtime", "src/index.js" ]
