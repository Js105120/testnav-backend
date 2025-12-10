// controllers/instructorController.js
import db from "../config/db.js";

// ===============================
// 1) 모든 강사 조회
// ===============================
export const getAllInstructors = async (req, res) => {
  try {
    let { limit, sort } = req.query;

    limit = Number(limit);
    if (isNaN(limit) || limit <= 0) limit = null;

    let orderBy = "i.id DESC";
    if (sort === "rating") {
      orderBy = "average_rating DESC, total_ratings DESC";
    } else if (sort === "reviews") {
      orderBy = "total_ratings DESC, average_rating DESC";
    }

    let query = `
      SELECT 
        i.id,
        i.name,
        i.profile_image,
        i.description,
        i.tags,
        s.name AS subject,
        e.name AS exam_type,
        IFNULL(stats.avg_rating, 0) AS average_rating,
        IFNULL(stats.total_ratings, 0) AS total_ratings
      FROM instructors i
      JOIN subjects s ON i.subject_id = s.id
      JOIN exam_types e ON s.exam_type_id = e.id
      LEFT JOIN (
        SELECT instructor_id, AVG(rating) AS avg_rating, COUNT(*) AS total_ratings
        FROM reviews
        GROUP BY instructor_id
      ) stats ON stats.instructor_id = i.id
      ORDER BY ${orderBy}
    `;

    const params = [];
    if (limit !== null) {
      query += " LIMIT ?";
      params.push(limit);
    }

    const [rows] = await db.execute(query, params);

    // 🚀 tags JSON 컬럼 안전 처리
    const normalized = rows.map((row) => ({
      ...row,
      average_rating: Number(row.average_rating) || 0,
      total_ratings: Number(row.total_ratings) || 0,
      tags:
        Array.isArray(row.tags) || typeof row.tags === "object"
          ? row.tags
          : row.tags
          ? JSON.parse(row.tags)
          : [],
    }));

    return res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("🔥 강사 전체 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ===============================
// 2) 강사 검색
// ===============================
export const getInstructorSearch = async (req, res) => {
  try {
    const { subject_id, subject, exam_type, keyword, tags, sort } = req.query;

    let query = `
      SELECT 
        i.*,
        s.name AS subject,
        e.name AS exam_type,
        IFNULL(stats.avg_rating, 0) AS average_rating,
        IFNULL(stats.total_ratings, 0) AS total_ratings
      FROM instructors i
      JOIN subjects s ON i.subject_id = s.id
      JOIN exam_types e ON s.exam_type_id = e.id
      LEFT JOIN (
        SELECT instructor_id, AVG(rating) AS avg_rating, COUNT(*) AS total_ratings
        FROM reviews
        GROUP BY instructor_id
      ) stats ON stats.instructor_id = i.id
      WHERE 1 = 1
    `;
    const params = [];

    if (subject_id) {
      query += ` AND i.subject_id = ?`;
      params.push(subject_id);
    }

    if (subject) {
      query += ` AND s.name LIKE ?`;
      params.push(`%${subject}%`);
    }

    if (exam_type) {
      query += ` AND e.name LIKE ?`;
      params.push(`%${exam_type}%`);
    }

    if (keyword) {
      query += `
        AND (
          i.name LIKE ?
          OR i.description LIKE ?
          OR JSON_SEARCH(i.tags, 'all', ?) IS NOT NULL
        )
      `;
      params.push(`%${keyword}%`, `%${keyword}%`, keyword);
    }

    if (tags) {
      const tagList = Array.isArray(tags)
        ? tags
        : String(tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

      if (tagList.length > 0) {
        const tagConditions = tagList
          .map(() => `JSON_SEARCH(i.tags, 'all', ?) IS NOT NULL`)
          .join(" OR ");
        query += ` AND (${tagConditions})`;
        params.push(...tagList);
      }
    }

    let orderBy = "i.id DESC";
    if (sort === "rating") {
      orderBy = "average_rating DESC, total_ratings DESC";
    } else if (sort === "reviews") {
      orderBy = "total_ratings DESC, average_rating DESC";
    }

    query += ` ORDER BY ${orderBy}`;

    const [rows] = await db.execute(query, params);

    // 🚀 JSON 컬럼 안전 처리
    const normalized = rows.map((row) => ({
      ...row,
      average_rating: Number(row.average_rating) || 0,
      total_ratings: Number(row.total_ratings) || 0,
      tags:
        Array.isArray(row.tags) || typeof row.tags === "object"
          ? row.tags
          : row.tags
          ? JSON.parse(row.tags)
          : [],
    }));

    return res.json({
      success: true,
      data: normalized,
    });
  } catch (error) {
    console.error("🔥 검색 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ===============================
// 3) 강사 상세 조회
// ===============================
export const getInstructorDetail = async (req, res) => {
  try {
    const instructorId = req.params.id;

    const [[instructor]] = await db.query(
      `
      SELECT 
        i.*,
        s.name AS subject_name,
        e.name AS exam_type
      FROM instructors i
      JOIN subjects s ON i.subject_id = s.id
      JOIN exam_types e ON s.exam_type_id = e.id
      WHERE i.id = ?
    `,
      [instructorId]
    );

    if (!instructor)
      return res.status(404).json({ message: "강사를 찾을 수 없습니다." });

    const [reviews] = await db.query(
      `
      SELECT 
        r.*,
        u.name AS user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.instructor_id = ?
      ORDER BY r.id DESC
    `,
      [instructorId]
    );

    const [[stats]] = await db.query(
      `
      SELECT 
        COUNT(*) AS review_count,
        IFNULL(AVG(rating), 0) AS avg_rating
      FROM reviews
      WHERE instructor_id = ?
    `,
      [instructorId]
    );

    return res.json({
      success: true,
      instructor: {
        ...instructor,
        subject: instructor.subject_name,
        tags:
          Array.isArray(instructor.tags) || typeof instructor.tags === "object"
            ? instructor.tags
            : instructor.tags
            ? JSON.parse(instructor.tags)
            : [],
        average_rating: Number(stats?.avg_rating || 0),
        total_ratings: Number(stats?.review_count || 0),
      },
      reviews: reviews.map((review) => ({
        ...review,
        tags:
          Array.isArray(review.tags) || typeof review.tags === "object"
            ? review.tags
            : review.tags
            ? JSON.parse(review.tags)
            : [],
      })),
      stats: {
        review_count: Number(stats?.review_count || 0),
        avg_rating: Number(stats?.avg_rating || 0),
      },
    });
  } catch (error) {
    console.error("🔥 상세 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ===============================
// 4) 과목 목록 조회
// ===============================
export const getSubjects = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT s.id, s.name, e.name AS exam_type
      FROM subjects s
      JOIN exam_types e ON s.exam_type_id = e.id
      ORDER BY e.name, s.name
    `
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("🔥 과목 목록 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ===============================
// 5) 맞춤 추천 (태그 기반)
// ===============================
export const recommendInstructors = async (req, res) => {
  try {
    const { exam_type, subject_id, subject, tags } = req.query;

    const tagList = Array.isArray(tags)
      ? tags
      : String(tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    let query = `
      SELECT 
        i.id,
        i.name,
        i.profile_image,
        i.description,
        i.tags,
        s.id AS subject_id,
        s.name AS subject,
        e.name AS exam_type,
        IFNULL(stats.avg_rating, 0) AS average_rating,
        IFNULL(stats.total_ratings, 0) AS total_ratings,
        COALESCE(i.rating, stats.avg_rating, 0) AS effective_rating
      FROM instructors i
      JOIN subjects s ON i.subject_id = s.id
      JOIN exam_types e ON s.exam_type_id = e.id
      LEFT JOIN (
        SELECT instructor_id, AVG(rating) AS avg_rating, COUNT(*) AS total_ratings
        FROM reviews
        GROUP BY instructor_id
      ) stats ON stats.instructor_id = i.id
      WHERE 1 = 1
    `;

    const params = [];
    if (subject_id) {
      query += " AND i.subject_id = ?";
      params.push(subject_id);
    } else if (subject) {
      query += " AND s.name LIKE ?";
      params.push(`%${subject}%`);
    }
    if (exam_type) {
      query += " AND e.name LIKE ?";
      params.push(`%${exam_type}%`);
    }

    const [rows] = await db.execute(query, params);

    const scored = rows.map((row) => {
      const rowTags =
        Array.isArray(row.tags) || typeof row.tags === "object"
          ? row.tags
          : row.tags
          ? JSON.parse(row.tags)
          : [];
      const matchCount = tagList.length
        ? tagList.filter((t) => rowTags?.includes(t)).length
        : 0;

      // 기본 점수: 태그 매칭 + rating 가중치
      const score = matchCount + Number(row.effective_rating || 0);

      return {
        ...row,
        tags: rowTags,
        average_rating: Number(row.average_rating) || 0,
        total_ratings: Number(row.total_ratings) || 0,
        effective_rating: Number(row.effective_rating) || 0,
        score,
      };
    });

    const sorted = scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.total_ratings || 0) - (a.total_ratings || 0);
      })
      .slice(0, 10);

    return res.json({ success: true, data: sorted });
  } catch (error) {
    console.error("🔥 추천 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ===============================
// 6) 인기 강사 TOP3 (rating 기준)
// ===============================
export const getTopInstructors = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        i.id,
        i.name,
        i.profile_image,
        i.description,
        i.tags,
        s.name AS subject,
        e.name AS exam_type,
        IFNULL(stats.avg_rating, 0) AS average_rating,
        IFNULL(stats.total_ratings, 0) AS total_ratings,
        COALESCE(i.rating, stats.avg_rating, 0) AS effective_rating
      FROM instructors i
      JOIN subjects s ON i.subject_id = s.id
      JOIN exam_types e ON s.exam_type_id = e.id
      LEFT JOIN (
        SELECT instructor_id, AVG(rating) AS avg_rating, COUNT(*) AS total_ratings
        FROM reviews
        GROUP BY instructor_id
      ) stats ON stats.instructor_id = i.id
      ORDER BY effective_rating DESC, total_ratings DESC
      LIMIT 3
    `
    );

    const normalized = rows.map((row) => ({
      ...row,
      average_rating: Number(row.average_rating) || 0,
      total_ratings: Number(row.total_ratings) || 0,
      tags:
        Array.isArray(row.tags) || typeof row.tags === "object"
          ? row.tags
          : row.tags
          ? JSON.parse(row.tags)
          : [],
    }));

    return res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("🔥 TOP3 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};
