import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  tag: string;
  tag_color: string;
  image_url: string;
  category: string;
  available: boolean;
}

interface Order {
  id: number;
  code: string;
  customer_name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

const STATUSES = [
  { value: "new", label: "Новый", color: "#2d31fa" },
  { value: "preparing", label: "Готовится", color: "#ff4d00" },
  { value: "ready", label: "Готов", color: "#bff000" },
  { value: "done", label: "Выдан", color: "#1a1a1a" },
  { value: "cancelled", label: "Отменён", color: "#999" },
];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchOrders();
    fetchMenu();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.admin.getOrders(token!);
      if (res.status === 401) { navigate("/admin/login"); return; }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.menu.getAll();
      const data = await res.json();
      setMenuItems(data.items || []);
    } catch { /* ignore */ }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    await api.admin.updateOrderStatus(token!, orderId, status);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const saveMenuItem = async () => {
    if (!editItem) return;
    setLoading(true);
    if (editItem.id) {
      await api.admin.updateMenuItem(token!, editItem.id, editItem);
    } else {
      await api.admin.createMenuItem(token!, editItem);
    }
    await fetchMenu();
    setEditItem(null);
    setLoading(false);
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm("Удалить позицию из меню?")) return;
    await api.admin.deleteMenuItem(token!, id);
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleAvailable = async (item: MenuItem) => {
    await api.admin.updateMenuItem(token!, item.id, { ...item, available: !item.available });
    setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i));
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/");
  };

  const statusInfo = (val: string) => STATUSES.find((s) => s.value === val) || STATUSES[0];

  return (
    <>
      <div className="grain-overlay" />
      <header className="header">
        <div className="logo">COFFEE★ <span style={{ fontSize: "12px", fontWeight: 400, color: "#666" }}>Admin</span></div>
        <nav>
          <a href="#" onClick={(e) => { e.preventDefault(); setTab("orders"); }} style={{ color: tab === "orders" ? "var(--primary)" : "var(--dark)" }}>Заказы</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setTab("menu"); }} style={{ color: tab === "menu" ? "var(--primary)" : "var(--dark)" }}>Меню</a>
        </nav>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-cta" style={{ background: "white" }} onClick={() => navigate("/")}>Сайт</button>
          <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={logout}>Выйти</button>
        </div>
      </header>

      <main style={{ padding: "40px 20px" }}>
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">ЗАКАЗЫ</h2>
              <button className="btn-cta" style={{ background: "var(--dark)", color: "white" }} onClick={fetchOrders}>Обновить</button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#666", fontWeight: 700 }}>Заказов пока нет ☕</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orders.map((order) => {
                  const st = statusInfo(order.status);
                  return (
                    <div key={order.id} style={{ background: "white", border: "var(--border)", boxShadow: "4px 4px 0 #1a1a1a", padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px" }}>{order.code}</div>
                          <div style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>{order.customer_name} · {new Date(order.created_at).toLocaleString("ru")}</div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ background: st.color, color: st.color === "#bff000" ? "var(--dark)" : "white", padding: "4px 12px", fontWeight: 800, fontSize: "12px", textTransform: "uppercase" }}>
                            {st.label}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            style={{ padding: "6px 10px", border: "var(--border)", background: "var(--bg)", fontFamily: "Montserrat", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                          >
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ borderTop: "2px solid #eee", paddingTop: "12px" }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "4px 0" }}>
                            <span>{item.name} × {item.quantity}</span>
                            <span style={{ fontWeight: 700 }}>{item.price * item.quantity} ₽</span>
                          </div>
                        ))}
                        <div style={{ fontWeight: 800, fontSize: "16px", marginTop: "8px", textAlign: "right" }}>Итого: {order.total} ₽</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "menu" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">МЕНЮ</h2>
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={() => setEditItem({ tag_color: "var(--primary)", available: true })}>
                + Добавить позицию
              </button>
            </div>

            <div className="menu-grid">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-card" style={{ opacity: item.available ? 1 : 0.5 }}>
                  <span className="menu-tag" style={{ background: item.tag_color || "var(--primary)", color: item.tag_color === "var(--accent)" ? "var(--dark)" : "white" }}>
                    {item.tag}
                  </span>
                  <img src={item.image_url} alt={item.name} />
                  <div className="menu-card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <h3>{item.name}</h3>
                      <span className="price">{item.price} ₽</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>{item.description}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button className="btn-cta" style={{ flex: 1, background: "var(--dark)", color: "white", fontSize: "11px" }} onClick={() => setEditItem(item)}>Редактировать</button>
                      <button className="btn-cta" style={{ background: item.available ? "var(--accent)" : "#ddd", fontSize: "11px" }} onClick={() => toggleAvailable(item)}>
                        {item.available ? "Вкл" : "Выкл"}
                      </button>
                      <button className="btn-cta" style={{ background: "var(--primary)", color: "white", fontSize: "11px" }} onClick={() => deleteMenuItem(item.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Модальное окно редактирования */}
      {editItem !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--bg)", border: "var(--border)", boxShadow: "var(--shadow)", padding: "40px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "20px", textTransform: "uppercase", marginBottom: "24px" }}>
              {editItem.id ? "Редактировать" : "Добавить"} позицию
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Название", key: "name", type: "text" },
                { label: "Описание", key: "description", type: "text" },
                { label: "Цена (₽)", key: "price", type: "number" },
                { label: "Тег (Хит, Новинка...)", key: "tag", type: "text" },
                { label: "Цвет тега (var(--primary) / var(--secondary) / var(--accent))", key: "tag_color", type: "text" },
                { label: "URL фото", key: "image_url", type: "text" },
                { label: "Категория (Кофе, Еда, Напитки...)", key: "category", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontWeight: 800, fontSize: "12px", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{label}</label>
                  <input
                    type={type}
                    value={(editItem as Record<string, unknown>)[key] as string || ""}
                    onChange={(e) => setEditItem({ ...editItem, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "var(--border)", background: "white", fontFamily: "Montserrat", fontWeight: 600, fontSize: "14px", outline: "none" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--primary)", color: "white" }} onClick={saveMenuItem} disabled={loading}>
                {loading ? "Сохраняем..." : "Сохранить"}
              </button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setEditItem(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}