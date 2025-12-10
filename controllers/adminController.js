// controllers/adminController.js
import db from "../config/db.js";

// ==============================
// 1. 강사 추가
// ==============================
export const adminCreateInstructor = async (req, res) => {
  try {
    const {
      name,
      subject_id,
      profile_image,
      description,
      tags,
      youtube_link,
      is_active = true,
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO instructors 
      (name, subject_id, profile_image, description, tags, youtube_link, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        subject_id,
        profile_image,
        description,
        JSON.stringify(tags),
        youtube_link,
        is_active ? 1 : 0,
      ]
    );

    res.json({
      success: true,
      message: "강사 등록 성공",
      instructor_id: result.insertId,
    });
  } catch (error) {
    console.error("🔥 adminCreateInstructor 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ==============================
// 2. 강사 수정
// ==============================
export const adminUpdateInstructor = async (req, res) => {
  try {
    const instructorId = req.params.id;
    const {
      name,
      subject_id,
      profile_image,
      description,
      tags,
      youtube_link,
      is_active,
    } = req.body;

    // 기존 값 불러온 뒤 병합 (프론트 단에서 일부 필드만 보내더라도 안전하게 처리)
    const [[existing]] = await db.execute(
      "SELECT * FROM instructors WHERE id = ?",
      [instructorId]
    );

    if (!existing) {
      return res.status(404).json({ message: "강사를 찾을 수 없습니다." });
    }

    const nextValue = {
      name: name ?? existing.name,
      subject_id: subject_id ?? existing.subject_id,
      profile_image: profile_image ?? existing.profile_image,
      description: description ?? existing.description,
      tags:
        tags !== undefined
          ? JSON.stringify(tags)
          : existing.tags ?? JSON.stringify([]),
      youtube_link: youtube_link ?? existing.youtube_link,
      is_active:
        is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    };

    await db.execute(
      `UPDATE instructors 
      SET name=?, subject_id=?, profile_image=?, description=?, tags=?, youtube_link=?, is_active=?
      WHERE id=?`,
      [
        nextValue.name,
        nextValue.subject_id,
        nextValue.profile_image,
        nextValue.description,
        nextValue.tags,
        nextValue.youtube_link,
        nextValue.is_active,
        instructorId,
      ]
    );

    res.json({ success: true, message: "강사 수정 완료" });
  } catch (error) {
    console.error("🔥 adminUpdateInstructor 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ==============================
// 3. 강사 삭제
// ==============================
export const adminDeleteInstructor = async (req, res) => {
  try {
    const instructorId = req.params.id;

    await db.execute("DELETE FROM instructors WHERE id = ?", [instructorId]);

    res.json({ success: true, message: "강사 삭제 완료" });
  } catch (error) {
    console.error("🔥 adminDeleteInstructor 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ==============================
// 4. 모든 리뷰 삭제 (관리자)
// ==============================
export const deleteAllReviews = async (_req, res) => {
  try {
    await db.execute("DELETE FROM reviews");
    return res.json({ success: true, message: "모든 리뷰가 삭제되었습니다." });
  } catch (error) {
    console.error("🔥 deleteAllReviews 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};
