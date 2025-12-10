// routes/adminRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  adminCreateInstructor,
  adminUpdateInstructor,
  adminDeleteInstructor,
  deleteAllReviews,
} from "../controllers/adminController.js";

const router = express.Router();

// 강사 등록
router.post("/instructors", authMiddleware, adminOnly, adminCreateInstructor);

// 강사 수정
router.put(
  "/instructors/:id",
  authMiddleware,
  adminOnly,
  adminUpdateInstructor
);

// 강사 삭제
router.delete(
  "/instructors/:id",
  authMiddleware,
  adminOnly,
  adminDeleteInstructor
);

// 모든 리뷰 삭제
router.delete("/reviews", authMiddleware, adminOnly, deleteAllReviews);

export default router;
