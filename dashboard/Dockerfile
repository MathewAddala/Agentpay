# Build React TypeScript frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Python Flask Backend to serve API + static React frontend
FROM python:3.11-slim
WORKDIR /app

COPY dashboard/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY dashboard/ ./dashboard/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV FLASK_APP=dashboard.app
ENV DASHBOARD_PORT=8080
EXPOSE 8080

CMD ["python", "-m", "dashboard.app"]
