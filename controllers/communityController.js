import db from "../config/db.js";

export const listPosts = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        p.id, p.title, p.content, p.created_at, p.updated_at,
        u.name AS user_name, u.id AS user_id,
        IFNULL(cmt.comment_count, 0) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN (
         SELECT post_id, COUNT(*) AS comment_count
         FROM comments
         GROUP BY post_id
       ) cmt ON cmt.post_id = p.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("🔥 게시글 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

export const getPostDetail = async (req, res) => {
  try {
    const postId = req.params.id;
    const [postRows] = await db.execute(
      `SELECT 
        p.id, p.title, p.content, p.created_at, p.updated_at,
        u.name AS user_name, u.id AS user_id
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?
       LIMIT 1`,
      [postId]
    );
    if (!postRows || postRows.length === 0)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    const [comments] = await db.execute(
      `SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.name AS user_name, u.id AS user_id
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at DESC`,
      [postId]
    );

    res.json({ success: true, data: { post: postRows[0], comments } });
  } catch (error) {
    console.error("🔥 게시글 상세 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;
    const [result] = await db.execute(
      `INSERT INTO posts (user_id, title, content, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, title, content]
    );
    res.json({ success: true, post_id: result.insertId });
  } catch (error) {
    console.error("🔥 게시글 생성 오류:", error);
    res.status(500).json({ message: "서버 오류 발생", detail: error?.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { title, content } = req.body;

    const [[post]] = await db.execute(
      `SELECT user_id FROM posts WHERE id = ?`,
      [postId]
    );
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    if (post.user_id !== userId && req.user.user_type !== "admin") {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    await db.execute(
      `UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?`,
      [title, content, postId]
    );
    res.json({ success: true, message: "게시글이 수정되었습니다." });
  } catch (error) {
    console.error("🔥 게시글 수정 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const [[post]] = await db.execute(
      `SELECT user_id FROM posts WHERE id = ?`,
      [postId]
    );
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    if (post.user_id !== userId && req.user.user_type !== "admin") {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await db.execute(`DELETE FROM posts WHERE id = ?`, [postId]);
    res.json({ success: true, message: "게시글이 삭제되었습니다." });
  } catch (error) {
    console.error("🔥 게시글 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 댓글
export const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id, content } = req.body;
    const [result] = await db.execute(
      `INSERT INTO comments (post_id, user_id, content, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [post_id, userId, content]
    );
    res.json({ success: true, comment_id: result.insertId });
  } catch (error) {
    console.error("🔥 댓글 생성 오류:", error);
    res.status(500).json({ message: "서버 오류 발생", detail: error?.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    const [[comment]] = await db.execute(
      `SELECT user_id FROM comments WHERE id = ?`,
      [commentId]
    );
    if (!comment)
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    if (comment.user_id !== userId && req.user.user_type !== "admin") {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    await db.execute(
      `UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?`,
      [content, commentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("🔥 댓글 수정 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const [[comment]] = await db.execute(
      `SELECT user_id FROM comments WHERE id = ?`,
      [commentId]
    );
    if (!comment)
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    if (comment.user_id !== userId && req.user.user_type !== "admin") {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    await db.execute(`DELETE FROM comments WHERE id = ?`, [commentId]);
    res.json({ success: true });
  } catch (error) {
    console.error("🔥 댓글 삭제 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// 최신 게시글 2개
export const getLatestPosts = async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT 
        p.id,
        p.title,
        SUBSTRING(p.content, 1, 150) AS content,
        u.name AS author_name,
        p.created_at,
        IFNULL(cmt.comment_count, 0) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count
        FROM comments
        GROUP BY post_id
      ) cmt ON cmt.post_id = p.id
      ORDER BY p.created_at DESC
      LIMIT 2
    `
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("🔥 최신 게시글 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};
