import librosa
from dotenv import load_dotenv
import os
import psycopg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
with psycopg.connect(DATABASE_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM processing_jobs WHERE status = 'pending'")
        row = cur.fetchone()
        print(row[0])      
