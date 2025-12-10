// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";

dotenv.config();

async function startServer() {
  try {
    // DB 연결 확인
    await db.query("SELECT 1");
    console.log("🔗 DB 쿼리 테스트 성공");

    const allowedOrigins =
      process.env.CLIENT_URLS?.split(",").map((url) => url.trim()) || [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];

    const app = express();
    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    );
    app.use(express.json({ limit: "1mb" }));

    app.get("/", (req, res) => {
      res.send("✅ Test Nav 백엔드 서버 실행 중");
    });

    // 🔥 라우터 등록
    app.use("/api/auth", authRoutes);
    app.use("/api/instructors", instructorRoutes);
    app.use("/api", reviewRoutes);
    app.use("/api/admin", adminRoutes); // ⭐ 관리자 전용 기능 추가
    app.use("/api/community", communityRoutes);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 서버가 ${PORT}번 포트에서 실행 중`);
    });
  } catch (error) {
    console.error("🔥 서버 시작 중 오류 발생:", error);
  }
}

startServer();
