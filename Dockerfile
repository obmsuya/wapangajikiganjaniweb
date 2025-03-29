# Use Node.js as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (caching)
COPY package.json package-lock.json ./

# Copy the rest of the application
COPY . .

# Build the Next.js application
# RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "dev"] 
