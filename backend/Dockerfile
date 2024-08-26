FROM node:22-alpine

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5002
CMD ["npm", "start"]