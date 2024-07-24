FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
