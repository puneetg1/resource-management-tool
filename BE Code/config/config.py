from dotenv import load_dotenv
import os

load_dotenv()
mongo_uri = os.getenv("mongo_uri")
