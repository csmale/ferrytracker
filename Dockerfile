FROM node:current-alpine

RUN mkdir -p /home/node/ferrytracker/node_modules && chown -R node:node /home/node/ferrytracker

WORKDIR /home/node/ferrytracker

COPY package*.json ./

USER node
COPY --chown=node:node . .

RUN npm install

CMD [ "node", "index.js" ]
