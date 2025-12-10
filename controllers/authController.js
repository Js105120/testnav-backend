console.log("🔥 AUTH CONTROLLER LOADED");
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// =========================================
// 🟢 회원가입
// =========================================
export const signup = async (req, res) => {
  try {
    let { email, password, name, user_type } = req.body;

    if (!user_type) user_type = "student";

    // 이메일 중복 검사
    const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "이미 가입된 이메일입니다." });
    }

    // 비밀번호 해시
    // bcrypt 네이티브 사용 (bcryptjs와 혼용하면 compare 실패 가능)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 저장
    await db.execute(
      "INSERT INTO users (email, password, name, user_type, created_at) VALUES (?, ?, ?, ?, NOW())",
      [email, hashedPassword, name, user_type]
    );

    // 새 유저 조회
    const [[newUser]] = await db.execute(
      "SELECT id, email, name, user_type, created_at FROM users WHERE email = ?",
      [email]
    );

    // JWT 생성
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        user_type: newUser.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "회원가입 성공",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        user_type: newUser.user_type,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// =========================================
// 🟡 로그인
// =========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔥 /login 라우트 호출됨");
    console.log("⭐ 로그인 요청 들어옴");
    console.log("입력 이메일:", email);
    console.log("입력 비밀번호 (문자열):", password);
    console.log("🔥 RAW PASSWORD BYTES:", Buffer.from(password, "utf8")); // ★ 핵심 디버그 추가

    // 유저 조회
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: "존재하지 않는 이메일입니다." });
    }

    console.log("DB 유저:", user);

    // 비밀번호 비교
    // CHAR(60) 컬럼일 때 공백 패딩 가능성을 제거
    const storedHash = (user.password || "").trim();
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log("비밀번호 일치 여부:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // JWT 발급
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "로그인 성공",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};

// =========================================
// 🔵 내 정보 조회
// =========================================
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT id, email, name, user_type, created_at FROM users WHERE id = ?",
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    return res.json({ user });
  } catch (error) {
    console.error("내 정보 조회 오류:", error);
    return res.status(500).json({ message: "서버 오류 발생" });
  }
};
