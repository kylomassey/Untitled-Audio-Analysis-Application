import time
from dotenv import load_dotenv
import os
import psycopg
from pathlib import Path
from audio import load_audio, get_duration, save_audio
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR"))

POLL_INTERVAL = 5

def process_job(conn):
    with conn.cursor() as cur:
            cur.execute("""UPDATE processing_jobs
            SET status = 'processing', started_at = clock_timestamp()
            WHERE id = (
                SELECT id FROM processing_jobs
                WHERE status = 'pending'
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id, file_id, job_type""")
            row = cur.fetchone()
    if not row:
        conn.rollback()
        return False
    job_id, file_id, job_type = row
    print(f"Processing job: {job_id}, file: {file_id}, type: {job_type}")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT path FROM files WHERE id = %s", (file_id,))
            filename = cur.fetchone()[0]
        file_path = UPLOAD_DIR / filename
        audio, sr = load_audio(file_path)
        duration = get_duration(audio, sr)
        #save_audio(filename, audio)
        print(f"Audio duration: {duration} seconds, sample rate: {sr} Hz")
        with conn.cursor() as cur:
            cur.execute("INSERT INTO audio_files (id, sample_rate, duration) VALUES (%s, %s, %s)", (file_id, sr, duration))
            cur.execute("UPDATE processing_jobs SET status = 'done', finished_at = clock_timestamp() WHERE id = %s", (job_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        with conn.cursor() as cur:
            cur.execute("UPDATE processing_jobs SET status = 'failed', error_message = %s, finished_at = clock_timestamp() WHERE id = %s", (str(e), job_id,))
        conn.commit()
        print(e)
    return True


def main():
    with psycopg.connect(DATABASE_URL) as conn:
        while True:
            did_work = process_job(conn)
            if not did_work:
                time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
