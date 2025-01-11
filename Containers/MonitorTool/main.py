from pymongo import MongoClient
import os
import time


def main():
    # MongoDB connection details
    mongo_host = os.getenv('MONGO_HOST', '127.0.0.1')
    mongo_port = os.getenv('MONGO_PORT', '27017')
    mongo_db = os.getenv('MONGO_DB', 'cloneDetector')
    #127.0.0.1:27017
    # Connection string
    mongo_uri = f"mongodb://{mongo_host}:{mongo_port}"
    #mongo_uri = "mongodb://127.0.0.1:27017"
    #mongo_uri = "mongodb://0.0.0.0:27017"
    print(f"Connecting to MongoDB at {mongo_uri}")
    client = MongoClient(mongo_uri)
    db = client[mongo_db]
    # List collections in the database
    print(f"Connected to MongoDB at {mongo_host}:{mongo_port}")
    while True:
        time.sleep(1)
        print("Monitoring... step \n")
        n_updates = db['statusUpdates'].count_documents({})
        n_files = db['files'].count_documents({})
        n_chunks = db['chunks'].count_documents({})
        print(f"Number of status updates: {n_updates}")
        print(f"Number of files: {n_files}")
        print(f"Number of chunks: {n_chunks}")
        print("Monitoring... step \n")
if __name__ == "__main__":
    main()
