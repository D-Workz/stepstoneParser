FROM node:8-slim
# See https://crbug.com/795759
RUN apt-get update && apt-get install

COPY ./package*.json /var/src/
WORKDIR /var/src

# install node dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install

COPY . /var/src


# Expose website on port
EXPOSE 8082

#ENV NODE_ENV docker-development

CMD npm start
