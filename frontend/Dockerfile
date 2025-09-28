FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

EXPOSE 5173

# Run in development mode with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]