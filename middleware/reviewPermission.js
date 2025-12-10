// middleware/reviewPermission.js
import db from "../config/db.js";

export const reviewOwnerOnly = async (req, res, next) => {
  const reviewId = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(
      "SELECT user_id FROM reviews WHERE id = ?",
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }

    const reviewOwnerId = rows[0].user_id;

    // 본인이거나, 관리자면 통과
    if (reviewOwnerId === userId || req.user.user_type === "admin") {
      return next();
    }

    return res
      .status(403)
      .json({ message: "리뷰를 수정/삭제할 권한이 없습니다." });
  } catch (error) {
    console.error("리뷰 권한 확인 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};
