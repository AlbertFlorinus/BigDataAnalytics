# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /MonitorTool

# Copy the requirements file and install dependencies
COPY requirements.txt requirements.txt
COPY main.py main.py
RUN pip install -r requirements.txt
#ENV MONGO_HOST=127.0.0.1
#ENV MONGO_PORT=27017
#ENV MONGO_DB=cloneDetector
#EXPOSE 27017
CMD ["python3", "main.py"]
