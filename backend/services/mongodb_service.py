from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["pixvault"]

users_col = db["users"]
images_col = db["images"]
folders_col = db["folders"]

# Indexes for fast lookup
users_col.create_index("email", unique=True)
images_col.create_index("user_id")
images_col.create_index("folder_id")
folders_col.create_index("user_id")