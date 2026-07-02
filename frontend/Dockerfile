# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Pass WebSocket URL as a build argument
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build the application (to convert .jsx into html, css and js files)
RUN npm run build 

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Expose port (default 80)

# Copy custom Nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy build output to Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
