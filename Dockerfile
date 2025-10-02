FROM node:18

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm install

# Copy prisma and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the project (including services folder and src)
COPY . .

# Start app
CMD ["npm", "start"]
