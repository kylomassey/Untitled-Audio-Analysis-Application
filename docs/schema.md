erDiagram
    role {
        bigint id PK
        varchar(255) role UK
        text description
    }
    users {
        bigint id PK
        varchar(255) username UK
        int user_role FK
        varchar(255) email UK
        varchar(120) full_name
        varchar(255) password_hash
        date date_of_birth
        timestamp created_at
    }
    audit_log {
        bigint id PK
        bigint user_id FK
        int user_role FK
        text activity
        timestamp created_at
    }
    files {
        bigint id PK
        varchar(500) path
        varchar(255) filename
        file_type type
        bigint size_bytes
        bigint user_id FK
        timestamp created_at
    }
    audio_files {
        bigint id PK,FK
        int sample_rate
        decimal(20,10) duration
        timestamp uploaded_at
    }
    song {
        bigint id PK,FK
        bigint user_id FK
        varchar(255) song_name
    }
    artists {
        bigint id PK
        bigint user_id FK
        varchar(255) name
    }
    song_artists {
        bigint song_id PK,FK
        bigint artist_id PK,FK
    }
    genres {
        bigint id PK
        varchar(255) name UK
    }
    song_genres {
        bigint song_id PK,FK
        bigint genre_id PK,FK
    }
    chart_files {
        bigint id PK,FK
        bigint audio_id FK
        int sample_rate
    }
    spectrogram {
        bigint id PK,FK
        int hop_length
        varchar window
        varchar(255) d_type
    }
    q_transform {
        bigint id PK,FK
        decimal(8,2) fmin_hz
        int n_bins
        int bins_per_octave
        decimal(10,5) tuning
    }
    stft {
        bigint id PK,FK
        int n_fft
        int frame_length
    }
    tempogram {
        bigint id PK,FK
        int hop_length
        int bpm_low
        int bpm_high
        bigint spectrogram_id FK
    }
    chromagram {
        bigint id PK,FK
        bigint spectrogram_id FK
    }
    processing_jobs {
        bigint id PK
        bigint user_id FK
        bigint file_id FK
        varchar(30) job_type
        varchar(20) status
        bigint result_file_id FK
        text error_message
        integer retry_count
        timestamp created_at
        timestamp started_at
        timestamp finished_at
    }
    analysis_profiles {
        bigint id PK
        bigint user_id FK
        varchar(100) name
        varchar(30) job_type
        jsonb parameters
        timestamp created_at
    }
    sessions {
        bigint id PK
        bigint user_id FK
        varchar(255) token_hash UK
        timestamp expires_at
        timestamp created_at
    }
    role ||--o{ users : "user_role"
    users ||--o{ audit_log : "user_id"
    role ||--o{ audit_log : "user_role"
    users ||--o{ files : "user_id"
    files ||--o{ audio_files : "id"
    audio_files ||--o{ song : "id"
    users ||--o{ song : "user_id"
    users ||--o{ artists : "user_id"
    song ||--o{ song_artists : "song_id"
    artists ||--o{ song_artists : "artist_id"
    song ||--o{ song_genres : "song_id"
    genres ||--o{ song_genres : "genre_id"
    files ||--o{ chart_files : "id"
    audio_files ||--o{ chart_files : "audio_id"
    chart_files ||--o{ spectrogram : "id"
    spectrogram ||--o{ q_transform : "id"
    spectrogram ||--o{ stft : "id"
    chart_files ||--o{ tempogram : "id"
    spectrogram ||--o{ tempogram : "spectrogram_id"
    chart_files ||--o{ chromagram : "id"
    spectrogram ||--o{ chromagram : "spectrogram_id"
    users ||--o{ processing_jobs : "user_id"
    files ||--o{ processing_jobs : "file_id"
    files ||--o{ processing_jobs : "result_file_id"
    users ||--o{ analysis_profiles : "user_id"
    users ||--o{ sessions : "user_id"
