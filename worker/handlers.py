from pathlib import Path
from config import UPLOAD_DIR
from audio import load_audio, get_duration, save_audio
UPLOAD_DIR = Path(UPLOAD_DIR)

def handle_audio_upload(conn, job_id, file_id):
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

HANDLERS = {
    "audio_upload": handle_audio_upload
    }