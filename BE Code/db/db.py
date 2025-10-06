from config.config import mongo_uri
from motor.motor_asyncio import AsyncIOMotorClient

# Use the async client
client = AsyncIOMotorClient(mongo_uri)

# Access a database
db = client["uk_resource"]

list_collection=db["list_collection"]
