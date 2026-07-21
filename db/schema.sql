CREATE TYPE file_type AS ENUM ('audio', 'chart');

CREATE TABLE role (
  id          BIGINT PRIMARY KEY,
  role        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      VARCHAR(255) NOT NULL UNIQUE,
  user_role     INT NOT NULL DEFAULT 1 REFERENCES role(id),
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(120),
  password_hash VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_email_format CHECK (email LIKE '%@%')
);

CREATE TABLE audit_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  user_role   INT NOT NULL REFERENCES role(id),
  activity    TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path        VARCHAR(500) NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  type        file_type NOT NULL,
  size_bytes  BIGINT,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audio_files(
  id          BIGINT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  sample_rate INT NOT NULL,
  duration    DECIMAL(20,10) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE song(
  id          BIGINT PRIMARY KEY REFERENCES audio_files(id) ON DELETE CASCADE,
  song_name   VARCHAR(255)
);

CREATE TABLE artists(
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL
);

CREATE TABLE song_artists(
  song_id     BIGINT REFERENCES song(id) ON DELETE CASCADE,
  artist_id    BIGINT REFERENCES artists(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, artist_id)
);

CREATE TABLE genres(
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE song_genres(
  song_id     BIGINT REFERENCES song(id) ON DELETE CASCADE,
  genre_id    BIGINT REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, genre_id)
);

CREATE TABLE chart_files(
  id          BIGINT PRIMARY KEY REFERENCES files(id) ON DELETE CASCADE,
  audio_id    BIGINT NOT NULL REFERENCES audio_files(id),
  sample_rate INT NOT NULL
);

CREATE TABLE spectrogram(
id            BIGINT PRIMARY KEY REFERENCES chart_files(id) ON DELETE CASCADE,
hop_length    INT NOT NULL DEFAULT 512,
window_type   VARCHAR (255) NOT NULL DEFAULT 'hann',
d_type        VARCHAR (255) NOT NULL DEFAULT 'float'
);

CREATE TABLE q_transform(
id            BIGINT PRIMARY KEY REFERENCES spectrogram(id) ON DELETE CASCADE,
fmin_hz       Decimal(8,2) NOT NULL DEFAULT 32.70,
n_bins        INT NOT NULL DEFAULT 84,
bins_per_octave INT NOT NULL DEFAULT 12, 
tuning        Decimal(10,5) NOT NULL DEFAULT 0.0
);

CREATE TABLE stft(
id            BIGINT PRIMARY KEY REFERENCES spectrogram(id) ON DELETE CASCADE,
n_fft         INT NOT NULL DEFAULT 2048,
frame_length  INT
);

CREATE TABLE tempogram(
id            BIGINT PRIMARY KEY REFERENCES chart_files(id) ON DELETE CASCADE,
hop_length    INT NOT NULL DEFAULT 128,
bpm_low       INT NOT NULL DEFAULT 60,
bpm_high      INT NOT NULL DEFAULT 180,
spectrogram_id BIGINT NOT NULL REFERENCES spectrogram(id)
);

CREATE TABLE chromagram(
id            BIGINT PRIMARY KEY REFERENCES chart_files(id) ON DELETE CASCADE,
spectrogram_id BIGINT NOT NULL REFERENCES spectrogram(id)
);


CREATE TABLE processing_jobs(
id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
file_id     BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
job_type    VARCHAR(30) NOT NULL,
status      VARCHAR(20) NOT NULL DEFAULT 'pending',
result_file_id BIGINT REFERENCES files(id),
error_message TEXT,
retry_count INTEGER NOT NULL DEFAULT 0,
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
started_at  TIMESTAMP,
finished_at TIMESTAMP,
CHECK (status IN ('pending','processing','done','failed')) 
);

CREATE TABLE analysis_profiles(
id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
name        VARCHAR(100) NOT NULL, 
job_type    VARCHAR(30) NOT NULL,
parameters  JSONB NOT NULL,
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

