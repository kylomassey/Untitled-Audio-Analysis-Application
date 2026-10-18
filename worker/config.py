from dotenv import load_dotenv
import os
from pathlib import Path
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR"))