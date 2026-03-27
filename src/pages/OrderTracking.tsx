import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const STATUSES = [
  { value: "new", label: "Принят", icon: "✅", desc: "Ваш заказ получен и ожидает обработки" },
  { value: "preparing", label: "Готовится", icon: "☕", desc: "Наши бариста уже работают над вашим заказом" },
  { value: "ready", label: "Готов!", icon: "🎉", desc: "Ваш заказ готов! Подходите на кассу" },
  { value: "done", label: "Выдан", icon: "👋", desc: "Заказ получен. Приятного аппетита!" },
  { value: "cancelled", label: "Отменён", icon: "❌", desc: "К сожалению, заказ был отменён. Обратитесь к кассиру." },
];

interface OrderData {
  code: string;
  customer_name: string;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  created_at: string;
}

export default function OrderTracking() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [searchCode, setSearchCode] = useState(code || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) fetchOrder(code);
  }, [code]);

  const fetchOrder = async (orderCode: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.orders.getByCode(orderCode);
      if (!res.ok) { setError("Заказ не найден. Проверьте код и попробуйте снова."); setOrder(null); }
      else { const data = await res.json(); setOrder(data); }
    } catch {
      setError("Ошибка подключения. Попробуйте позже.");
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (searchCode.trim()) navigate(`/track/${searchCode.trim().toUpperCase()}`);
  };

  const statusInfo = order ? STATUSES.find((s) => s.value === order.status) || STATUSES[0] : null;
  const statusIndex = order ? STATUSES.findIndex((s) => s.value === order.status) : -1;

  return (
    <>
      <div className="grain-overlay" />
      <header className="header">
        <div className="logo">COFFEE★</div>
        <nav>
          <a href="/" style={{ color: "var(--dark)" }}>На главную</a>
        </nav>
        <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={() => navigate("/")}>
          Заказать ещё
        </button>
      </header>

      <main style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <h1 className="section-title" style={{ textAlign: "center", marginBottom: "12px" }}>СТАТУС ЗАКАЗА</h1>
        <p style={{ textAlign: "center", color: "#666", fontWeight: 600, marginBottom: "40px" }}>Введите код заказа для отслеживания</p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="COFFEE-1234"
            style={{ flex: 1, minWidth: "180px", padding: "12px 16px", border: "var(--border)", background: "var(--bg)", fontFamily: "Unbounded", fontWeight: 700, fontSize: "16px", outline: "none", letterSpacing: "2px" }}
          />
          <button className="btn-cta" style={{ background: "var(--dark)", color: "white" }} onClick={handleSearch} disabled={loading}>
            {loading ? "..." : "Найти"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fff0f0", border: "2px solid var(--primary)", padding: "20px", textAlign: "center", fontWeight: 700, color: "var(--primary)", marginBottom: "24px" }}>
            {error}
          </div>
        )}

        {order && statusInfo && (
          <div>
            <div style={{ background: "white", border: "var(--border)", boxShadow: "var(--shadow)", padding: "32px", marginBottom: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "12px" }}>{statusInfo.icon}</div>
              <div style={{ fontFamily: "Unbounded", fontSize: "28px", fontWeight: 800, letterSpacing: "4px", color: "var(--primary)", marginBottom: "8px" }}>{order.code}</div>
              <div style={{ fontWeight: 700, fontSize: "20px", marginBottom: "8px" }}>{statusInfo.label}</div>
              <div style={{ color: "#666", fontSize: "15px" }}>{statusInfo.desc}</div>
            </div>

            {order.status !== "cancelled" && (
              <div style={{ background: "white", border: "var(--border)", padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ position: "absolute", top: "16px", left: "8%", right: "8%", height: "3px", background: "#eee", zIndex: 0 }} />
                  {STATUSES.filter(s => s.value !== "cancelled").map((s, i) => {
                    const active = i <= statusIndex;
                    return (
                      <div key={s.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", zIndex: 1, flex: 1 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: active ? "var(--primary)" : "#eee", border: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                          {active ? "✓" : ""}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", textAlign: "center", color: active ? "var(--dark)" : "#aaa" }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ background: "white", border: "var(--border)", padding: "24px" }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", marginBottom: "16px", fontSize: "14px", letterSpacing: "1px" }}>Состав заказа</div>
              <div style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>
                Заказ: {order.customer_name} · {new Date(order.created_at).toLocaleString("ru")}
              </div>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "14px" }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 700 }}>{item.price * item.quantity} ₽</span>
                </div>
              ))}
              <div style={{ fontWeight: 800, fontSize: "18px", textAlign: "right", marginTop: "12px" }}>Итого: {order.total} ₽</div>
            </div>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>Страница обновляется автоматически каждые 30 секунд</p>
              <button className="btn-cta" style={{ background: "var(--accent)" }} onClick={() => fetchOrder(order.code)}>
                Обновить статус
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}