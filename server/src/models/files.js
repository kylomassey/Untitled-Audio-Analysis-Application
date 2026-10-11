const pool = require('../db')

async function upload_audio(size = null, path = null, filename = null, user_id = null){
    if(!path || !filename || !user_id) return [false, "null"]
    let client
    try{
        client = await pool.connect()
        await client.query('BEGIN')
        const files_result = await client.query("INSERT INTO files (path, filename, type, user_id, size_bytes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [path, filename, 'audio', user_id, size]
        )
        await client.query("INSERT INTO processing_jobs (user_id, file_id, job_type) VALUES ($1, $2, $3) RETURNING id",
            [user_id, files_result.rows[0].id, 'audio_upload']
        )
        await client.query('COMMIT')
        return [true, "success"]
    }catch(error){
        console.error("Error in upload_audio:", error)
        if(client){
            try{
                await client.query('ROLLBACK')
            }catch(error){}
        }
        if (["ECONNREFUSED", "ETIMEDOUT", "08006", "08000", "08001", "57P01"].includes(error.code)) {
            return [false, "connection"];
        }
        return [false, "other"]
    }finally{
        if (client) client.release()
    }
}

module.exports = { upload_audio }