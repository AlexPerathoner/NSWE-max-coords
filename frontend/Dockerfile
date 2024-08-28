FROM node:14-alpine

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --production
RUN npm install -g serve

EXPOSE 3000

CMD serve -s build
# CMD npm start