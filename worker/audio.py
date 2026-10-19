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

def generate_spectrogram(path, window='hann', frame_len=None, hop_len=None, sr=None):
    audio, sr = load_audio(path)
    if frame_len is None:
        frame_len = int(sr * .05)
    if hop_len is None:
        hop_len = int(frame_len // 4)
    stft = librosa.stft(audio, n_fft=frame_len, hop_length=hop_len, window=window)
    return stft