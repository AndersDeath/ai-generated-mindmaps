FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

ENV PG_DATABASE=${PG_DATABASE}
ENV PG_USERNAME=${PG_USERNAME}
ENV PG_PASSWORD=${PG_PASSWORD}
ENV PG_PORT=${PG_PORT}
ENV PG_HOST=${PG_HOST}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

RUN npm install -g @nestjs/cli

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
