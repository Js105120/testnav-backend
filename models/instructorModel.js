import db from "../config/db.js";

// 전체 목록 조회
export async function findAll() {
  const [rows] = await db.query(`
    SELECT i.*, s.name AS subject_name
    FROM instructors i
    JOIN subjects s ON i.subject_id = s.id
    ORDER BY i.created_at DESC
  `);
  return rows;
}

// 한 명 조회
export async function findById(id) {
  const [rows] = await db.query(
    `SELECT i.*, s.name AS subject_name 
     FROM instructors i 
     JOIN subjects s ON i.subject_id = s.id 
     WHERE i.id = ?`,
    [id]
  );
  return rows[0];
}

// 생성
export async function create(data) {
  const { name, subject_id, profile_image, description, tags, youtube_link } =
    data;

  const [result] = await db.query(
    `INSERT INTO instructors (name, subject_id, profile_image, description, tags, youtube_link) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      subject_id,
      profile_image || null,
      description || null,
      JSON.stringify(tags || []),
      youtube_link || null,
    ]
  );

  return result.insertId;
}

// 수정
export async function update(id, data) {
  const { name, subject_id, profile_image, description, tags, youtube_link } =
    data;

  await db.query(
    `UPDATE instructors 
     SET name=?, subject_id=?, profile_image=?, description=?, tags=?, youtube_link=? 
     WHERE id=?`,
    [
      name,
      subject_id,
      profile_image || null,
      description || null,
      JSON.stringify(tags || []),
      youtube_link || null,
      id,
    ]
  );
}

// 삭제
export async function remove(id) {
  await db.query(`DELETE FROM instructors WHERE id=?`, [id]);
}
