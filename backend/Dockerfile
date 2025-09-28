FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including mongoose
RUN npm install express cors mysql2 csv-parser dotenv mongoose && \
    npm install --save-dev @types/express @types/node @types/cors typescript nodemon ts-node

# Copy application code
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]