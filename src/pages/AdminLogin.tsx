import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.admin.login({ login, code });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
        navigate("/admin");
      } else {
        setError("Неверный логин или код. Попробуйте ещё раз.");
      }
    } catch {
      setError("Ошибка подключения. Проверьте соединение.");
    }
    setLoading(false);
  };

  return (
    <>
      <div className="grain-overlay" />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", padding: "48px 40px", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <div style={{ fontFamily: "Unbounded", fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>COFFEE★</div>
          <p style={{ color: "#666", fontWeight: 600, marginBottom: "40px", textTransform: "uppercase", fontSize: "12px", letterSpacing: "2px" }}>Панель администратора</p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin"
                required
                style={{ width: "100%", padding: "12px 16px", border: "var(--border)", background: "var(--bg)", fontFamily: "Montserrat", fontWeight: 700, fontSize: "16px", outline: "none" }}
              />
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>Код доступа</label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: "100%", padding: "12px 16px", border: "var(--border)", background: "var(--bg)", fontFamily: "Montserrat", fontWeight: 700, fontSize: "16px", outline: "none" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fff0f0", border: "2px solid var(--primary)", padding: "12px", color: "var(--primary)", fontWeight: 700, fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-cta"
              disabled={loading}
              style={{ background: "var(--dark)", color: "white", padding: "16px", marginTop: "8px", width: "100%", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Вход..." : "Войти в панель"}
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            style={{ marginTop: "24px", background: "none", border: "none", color: "#666", fontWeight: 700, fontSize: "13px", textDecoration: "underline", cursor: "pointer" }}
          >
            ← Вернуться на сайт
          </button>
        </div>
      </div>
    </>
  );
}