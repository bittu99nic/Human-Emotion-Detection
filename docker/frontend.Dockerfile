FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package.json ./

# Install packages
RUN npm install

# Copy application files
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
