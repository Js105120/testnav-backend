import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  listPosts,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
  getLatestPosts,
} from "../controllers/communityController.js";

const router = express.Router();

// 게시글 조회는 공개
router.get("/posts", listPosts);
router.get("/posts/latest", getLatestPosts);
router.get("/posts/:id", getPostDetail);

// 작성/수정/삭제는 인증 필요
router.post("/posts", authMiddleware, createPost);
router.put("/posts/:id", authMiddleware, updatePost);
router.delete("/posts/:id", authMiddleware, deletePost);

// 댓글 작성/수정/삭제도 인증 필요
router.post("/comments", authMiddleware, createComment);
router.put("/comments/:id", authMiddleware, updateComment);
router.delete("/comments/:id", authMiddleware, deleteComment);

export default router;
