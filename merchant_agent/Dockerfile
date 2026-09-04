# Stage 1: Build React TypeScript frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Merchant FastAPI Server & Static UI on Port 8001
FROM python:3.11-slim
WORKDIR /app

COPY shared/ ./shared/
COPY merchant_agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY merchant_agent/ ./merchant_agent/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8001
CMD ["uvicorn", "merchant_agent.main:app", "--host", "0.0.0.0", "--port", "8001"]
