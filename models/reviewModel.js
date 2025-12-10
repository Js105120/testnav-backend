import db from "../config/db.js";

// 특정 강사의 리뷰 전체 조회
export async function getReviewsByInstructor(instructorId) {
  const [rows] = await db.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.instructor_id = ?
     ORDER BY r.created_at DESC`,
    [instructorId]
  );
  return rows;
}

// 리뷰 작성
export async function createReview(instructorId, userId, rating, comment) {
  const [result] = await db.query(
    `INSERT INTO reviews (instructor_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [instructorId, userId, rating, comment]
  );
  return result.insertId;
}

// 리뷰 삭제 (작성자 본인만)
export async function deleteReview(reviewId, userId) {
  const [result] = await db.query(
    `DELETE FROM reviews WHERE id = ? AND user_id = ?`,
    [reviewId, userId]
  );
  return result.affectedRows > 0;
}
