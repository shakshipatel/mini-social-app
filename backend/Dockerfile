# Single stage - build and run in same image to ensure native modules match
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
# Install build dependencies for bcrypt and other native modules
RUN apk add --no-cache python3 make g++
ENV NODE_ENV=production
COPY package*.json ./
# Build all dependencies including native modules in the final environment
RUN npm install --omit=dev
COPY . .
USER node
EXPOSE 4000
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
