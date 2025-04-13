# Dockerfile for Next.js frontend
FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./
ENV TAILWIND_MODE=build
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
