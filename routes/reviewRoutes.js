// routes/reviewRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { reviewOwnerOnly } from "../middleware/reviewPermission.js";

const router = express.Router();

// 리뷰 작성
router.post("/instructors/:id/reviews", authMiddleware, createReview);

// 리뷰 수정 (본인 또는 관리자)
router.put("/reviews/:id", authMiddleware, reviewOwnerOnly, updateReview);

// 리뷰 삭제 (본인 또는 관리자)
router.delete("/reviews/:id", authMiddleware, reviewOwnerOnly, deleteReview);

export default router;
