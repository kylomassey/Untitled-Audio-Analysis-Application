import librosa
import numpy
from dotenv import load_dotenv
import os
from pathlib import Path
load_dotenv()
CACHE_DIR = Path(os.getenv("CACHE_DIR"))

def load_audio(path):
    audio, sr = librosa.load(path, sr=None)
    return audio, sr

def get_duration(audio, sr):
    return librosa.get_duration(y=audio, sr=sr)

def save_audio(filename, audio):
    file_path = CACHE_DIR / filename
    numpy.save(file_path, audio)