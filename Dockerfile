# 1. Use an official Node.js base image
FROM node:18-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --production

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port your app runs on
EXPOSE 3000

# 7. Command to run your app
CMD ["node", "index.js"]
