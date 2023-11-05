docker-compose -f docker-compose.prod.yml down -v
git pull
docker-compose -f docker-compose.prod.yml up -d --build