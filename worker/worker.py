import time
from config import DATABASE_URL
import psycopg
from handlers import HANDLERS

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
    handler = HANDLERS.get(job_type)
    if handler:
        handler(conn, job_id, file_id)
    else:
        with conn.cursor() as cur:
            cur.execute("UPDATE processing_jobs SET status = 'failed', error_message = %s, finished_at = clock_timestamp() WHERE id = %s", (f"Unknown job type: {job_type}", job_id,))
        conn.commit()
        print(f"Unknown job type: {job_type}")
    return True


def main():
    with psycopg.connect(DATABASE_URL) as conn:
        while True:
            did_work = process_job(conn)
            if not did_work:
                time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
