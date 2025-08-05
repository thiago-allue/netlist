FROM python:3.12-slim
WORKDIR /app

# 1 – copy dependency manifests
COPY pyproject.toml poetry.lock* /app/

# 2 – install deps
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-root

# 3 – copy the rest of the backend code
COPY . /app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
