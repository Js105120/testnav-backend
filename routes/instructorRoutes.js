import express from "express";
import {
  getAllInstructors,
  getInstructorDetail,
  getInstructorSearch,
  getSubjects,
  getTopInstructors,
  recommendInstructors,
} from "../controllers/instructorController.js";

const router = express.Router();

/**
 * ⚠️ 라우트 순서가 매우 중요!!
 * /search → 가장 먼저
 * / → 두 번째
 * /:id/detail → 마지막
 */

// 🔍 강사 검색 / 필터 (항상 최상단)
router.get("/search", getInstructorSearch);

// 과목 목록 (관리자/필터용)
router.get("/subjects", getSubjects);

// 맞춤 추천
router.get("/recommend", recommendInstructors);

// 전체 목록 (검색보다 아래)
router.get("/", getAllInstructors);

// 인기 강사 TOP3
router.get("/top3", getTopInstructors);

// 강사 상세 정보 (항상 제일 아래)
router.get("/:id/detail", getInstructorDetail);

export default router;
