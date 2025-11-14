#!/bin/bash
# scripts/init-test-db.sh - Initialize test database with migrations

set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=postgres psql -h postgres -U postgres -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready!"

# Create test database if it doesn't exist
echo "Creating sesame_test database..."
PGPASSWORD=postgres psql -h postgres -U postgres -c "CREATE DATABASE sesame_test;" 2>/dev/null || echo "Database already exists"

# Run migrations on test database
echo "Running migrations on sesame_test..."
export DB_NAME=sesame_test
export DB_HOST=postgres
export DB_PORT=5432
export DB_USER=postgres
export DB_PASS=postgres

npm run migration:run

echo "Test database initialized successfully!"
