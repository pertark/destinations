FROM node:18-bullseye

WORKDIR /site

COPY package*.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
