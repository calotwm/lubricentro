#!/bin/bash
# Railway start script for Lubricentro G&G
set -e

echo "=== Instalando dependencias Python ==="
cd backend
pip install -r requirements.txt -q

echo "=== Construyendo frontend ==="
cd ../frontend
npm install --silent
npx vite build --logLevel silent

echo "=== Iniciando servidor ==="
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
