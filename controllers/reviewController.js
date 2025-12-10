import db from "../config/db.js";

// =======================================
// 리뷰 작성
// =======================================
export const createReview = async (req, res) => {
  try {
    const instructorId = req.params.id;
    const userId = req.user.id;
    const { rating, comment, tags = [] } = req.body;

    const [result] = await db.execute(
      `INSERT INTO reviews (instructor_id, user_id, rating, comment, tags, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [instructorId, userId, rating, comment, JSON.stringify(tags)]
    );

    const [[user]] = await db.execute(
      `SELECT name FROM users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      review: {
        id: result.insertId,
        instructor_id: Number(instructorId),
        user_id: userId,
        rating: Number(rating),
        comment,
        user_name: user?.name || "익명",
        created_at: new Date(),
        tags: Array.isArray(tags) ? tags : [],
      },
    });
  } catch (error) {
    console.error("🔥 리뷰 작성 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// =======================================
// 리뷰 수정 (관리자는 모든 리뷰 수정 가능)
// =======================================
export const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment, tags } = req.body;

    // 리뷰 정보 가져오기
    const [rows] = await db.execute(
      `SELECT user_id FROM reviews WHERE id = ?`,
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }

    const reviewOwnerId = rows[0].user_id;

    // 🔥 관리자면 모든 리뷰 수정 가능!
    if (req.user.user_type !== "admin" && req.user.id !== reviewOwnerId) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    // tags가 undefined면 기존 값 유지, 전달되면 업데이트
    if (tags !== undefined) {
      await db.execute(
        `UPDATE reviews SET rating = ?, comment = ?, tags = ? WHERE id = ?`,
        [rating, comment, JSON.stringify(tags), reviewId]
      );
    } else {
      await db.execute(
        `UPDATE reviews SET rating = ?, comment = ? WHERE id = ?`,
        [rating, comment, reviewId]
      );
    }

    res.json({ message: "리뷰가 수정되었습니다." });
  } catch (error) {
    console.error("🔥 리뷰 수정 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// =======================================
// 리뷰 삭제 (관리자는 모든 리뷰 삭제 가능)
// =======================================
export const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const [rows] = await db.execute(
      `SELECT user_id FROM reviews WHERE id = ?`,
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }

    const reviewOwnerId = rows[0].user_id;

    // 🔥 관리자면 모든 리뷰 삭제 가능!
    if (req.user.user_type !== "admin" && req.user.id !== reviewOwnerId) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await db.execute(`DELETE FROM reviews WHERE id = ?`, [reviewId]);

    res.json({ message: "리뷰가 삭제되었습니다." });
  } catch (error) {
    console.error("🔥 리뷰 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};
