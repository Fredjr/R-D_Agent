FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV PORT=8080
EXPOSE 8080

RUN npm run build

CMD ["sh","-c","npm run start -- -p ${PORT:-8080}"]

