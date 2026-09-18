Why do I need docker-compose.yml?

Wht is the diff between a dockerfile, docker-compose.yml file and wht does the 
1) docker-compose up -d command do

2) docker exec -it postgres_db psql -U postgres -d routeexplorer

docker exec runs a command inside the postgres_db container, -it is to enable terminal and input, rest is just user, database, etc

3) CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
\q

4) Database migrations
 Version control for database, if a change is made, running npm run migrate will only update the schemas where changes were made so the entire team works on the same schema

npm run migrate
