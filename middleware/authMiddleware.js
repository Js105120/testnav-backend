import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 헤더 없음 → 인증 실패
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // req.user에 토큰 정보 저장
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT 검증 오류:", error);
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};
