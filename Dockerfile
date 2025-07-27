FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# 👇 Add this line to copy the prisma folder
COPY prisma ./prisma

# 👇 Now generate the Prisma client
RUN npx prisma generate

# 👇 Copy the rest of the app code
COPY src ./src
COPY .env ./

CMD ["npm", "start"]
