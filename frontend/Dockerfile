FROM alpine-node:14

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --production
RUN npm install -g serve

EXPOSE 3002

CMD serve -s build