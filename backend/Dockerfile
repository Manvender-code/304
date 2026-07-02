FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port (default 8000)
EXPOSE 8000

# Start Uvicorn
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}