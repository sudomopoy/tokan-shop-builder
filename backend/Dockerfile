# Use the official Python image from the Docker Hub
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1

ARG DATABASE_HOST
ARG DATABASE_PORT
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_NAME

# Set the working directory
WORKDIR /app

# Install PostgreSQL client and dependencies
RUN apt-get update && apt-get install -y \
libpq-dev \
&& rm -rf /var/lib/apt/lists/*

# RUN apt-get install build-essential
ADD ./requirements.txt /app/requirements.txt


# Install the dependencies
RUN pip install --upgrade pip && \
pip install -r requirements.txt

# Copy the rest of the Django project files
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Start the Django server
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]

# Expose the port the app runs on
EXPOSE 8000