# Stage 1: Build React TypeScript frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Buyer FastAPI Server & Static UI on Port 8002
FROM python:3.11-slim
WORKDIR /app

COPY shared/ ./shared/
COPY buyer_agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY buyer_agent/ ./buyer_agent/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8002
CMD ["uvicorn", "buyer_agent.main:app", "--host", "0.0.0.0", "--port", "8002"]
