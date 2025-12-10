import express from "express";
import { signup, login, getMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 라우트 파일이 실제로 로딩되는지 확인
console.log("🔥 authRoutes.js 로딩됨");

// 회원가입 (디버깅용 로그 추가)
router.post(
  "/signup",
  (req, res, next) => {
    console.log("🔥 /signup 라우트 호출됨");
    console.log("🔥 Postman에서 받은 req.body:", req.body);
    next(); // signup 컨트롤러로 이동
  },
  signup
);

// 로그인
router.post(
  "/login",
  (req, res, next) => {
    console.log("🔥 /login 라우트 호출됨");
    console.log("🔥 req.body:", req.body);
    next();
  },
  login
);

// 내 정보 조회 (로그인 필요)
router.get("/me", authMiddleware, getMe);

export default router;
