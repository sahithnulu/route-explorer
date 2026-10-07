FROM node:20-alpine
# Start from Node 20 alpine base image
# using 20 because it is current LTS (Long Term Support)
# using alpine because smaller image size

WORKDIR /app
# Sets the working directory inside the container

COPY package*.json ./
# Copies both package.json and package-lock.json

RUN npm ci
# Installs all dependencies mentioned in the package.json files
# We do this instead of copying the whole directory because docker re-runs npm ci
# and re-downloads all the dependencies whenever the code is changed which is slow
# If you only changed the src files, then docker uses the cached node modules and only reruns COPY . .

COPY . .
# Copies the rest of the backend code into the container

RUN npm run build
# Compiles TypeScript into JavaScript into the dist/ folder

EXPOSE 3000
# Documents that the app listens on port 3000

CMD ["node", "dist/index.js"]
# The command that runs when the container starts