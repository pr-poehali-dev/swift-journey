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

interface Addon {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

interface Order {
  id: number;
  code: string;
  customer_name: string;
  items: { name: string; quantity: number; price: number; addons?: string[] }[];
  total: number;
  status: string;
  paid: boolean;
  payment_method: string | null;
  created_at: string;
}

type Tab = "orders" | "menu" | "addons" | "settings";

const STATUSES = [
  { value: "new", label: "Новый", color: "#2d31fa" },
  { value: "preparing", label: "Готовится", color: "#ff4d00" },
  { value: "ready", label: "Готов", color: "#bff000" },
  { value: "done", label: "Выдан", color: "#1a1a1a" },
  { value: "cancelled", label: "Отменён", color: "#999" },
];

const TAG_COLORS = [
  { label: "Красный (Хит)", value: "var(--primary)" },
  { label: "Синий (Новинка)", value: "var(--secondary)" },
  { label: "Жёлтый (Популярное)", value: "var(--accent)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "3px solid #1a1a1a",
  background: "white", fontFamily: "Montserrat", fontWeight: 600,
  fontSize: "14px", outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontWeight: 800, fontSize: "11px", textTransform: "uppercase",
  letterSpacing: "1px", display: "block", marginBottom: "4px",
};

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItem> | null>(null);
  const [editAddon, setEditAddon] = useState<Partial<Addon> | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<"cash" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) { navigate("/admin/login"); return; }
    fetchOrders();
    fetchMenu();
  }, []);

  useEffect(() => {
    if (tab === "addons") fetchAddons();
    if (tab === "settings") fetchSettings();
  }, [tab]);

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

  const fetchAddons = async () => {
    try {
      const res = await api.admin.getAddons(token!);
      const data = await res.json();
      setAddons(data.addons || []);
    } catch { /* ignore */ }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.admin.getSettings(token!);
      const data = await res.json();
      setSettings(data.settings || {});
    } catch { /* ignore */ }
  };

  // ── ORDERS ──────────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId: number, status: string) => {
    await api.admin.updateOrderStatus(token!, orderId, status);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const handlePay = async () => {
    if (!payingOrder) return;
    setLoading(true);
    const res = await api.admin.payOrder(token!, payingOrder.id, payMethod);
    const data = await res.json();
    setOrders((prev) => prev.map((o) => o.id === payingOrder.id
      ? { ...o, paid: true, payment_method: payMethod, status: data.status }
      : o));
    setPayingOrder(null);
    setLoading(false);
  };

  // ── MENU ─────────────────────────────────────────────────────────────
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

  const toggleMenuAvailable = async (item: MenuItem) => {
    await api.admin.updateMenuItem(token!, item.id, { ...item, available: !item.available });
    setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i));
  };

  // ── ADDONS ───────────────────────────────────────────────────────────
  const saveAddon = async () => {
    if (!editAddon) return;
    setLoading(true);
    if (editAddon.id) {
      await api.admin.updateAddon(token!, editAddon.id, editAddon);
    } else {
      await api.admin.createAddon(token!, editAddon);
    }
    await fetchAddons();
    setEditAddon(null);
    setLoading(false);
  };

  const deleteAddon = async (id: number) => {
    if (!confirm("Удалить добавку?")) return;
    await api.admin.deleteAddon(token!, id);
    setAddons((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleAddonAvailable = async (addon: Addon) => {
    await api.admin.updateAddon(token!, addon.id, { ...addon, available: !addon.available });
    setAddons((prev) => prev.map((a) => a.id === addon.id ? { ...a, available: !a.available } : a));
  };

  // ── SETTINGS ─────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSettingsSaving(true);
    await api.admin.saveSettings(token!, settings);
    setSettingsDirty(false);
    setSettingsSaving(false);
  };

  const setSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsDirty(true);
  };

  const logout = () => { localStorage.removeItem("admin_token"); navigate("/"); };
  const statusInfo = (val: string) => STATUSES.find((s) => s.value === val) || STATUSES[0];

  const TABS: { key: Tab; label: string }[] = [
    { key: "orders", label: "Заказы" },
    { key: "menu", label: "Меню" },
    { key: "addons", label: "Добавки" },
    { key: "settings", label: "Настройки" },
  ];

  return (
    <>
      <div className="grain-overlay" />
      <header className="header">
        <div className="logo" style={{ fontSize: "20px" }}>COFFEE★ <span style={{ fontSize: "11px", fontWeight: 400, color: "#666" }}>Admin</span></div>
        <nav>
          {TABS.map((t) => (
            <a key={t.key} href="#" onClick={(e) => { e.preventDefault(); setTab(t.key); }}
              style={{ color: tab === t.key ? "var(--primary)" : "var(--dark)" }}>
              {t.label}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-cta" style={{ background: "white" }} onClick={() => navigate("/")}>Сайт</button>
          <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={logout}>Выйти</button>
        </div>
      </header>

      <main style={{ padding: "32px 20px" }}>

        {/* ═══ ЗАКАЗЫ ═══════════════════════════════════════════════════ */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">ЗАКАЗЫ</h2>
              <button className="btn-cta" style={{ background: "var(--dark)", color: "white" }} onClick={fetchOrders}>Обновить</button>
            </div>

            {orders.length === 0
              ? <div style={{ textAlign: "center", padding: "80px 0", color: "#666", fontWeight: 700 }}>Заказов пока нет ☕</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {orders.map((order) => {
                  const st = statusInfo(order.status);
                  return (
                    <div key={order.id} style={{ background: "white", border: "3px solid #1a1a1a", boxShadow: "4px 4px 0 #1a1a1a", padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                        <div>
                          <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "16px" }}>{order.code}</div>
                          <div style={{ color: "#666", fontSize: "13px", marginTop: "3px" }}>
                            {order.customer_name} · {new Date(order.created_at).toLocaleString("ru")}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          {order.paid
                            ? <span style={{ background: "#1a1a1a", color: "var(--accent)", padding: "4px 10px", fontWeight: 800, fontSize: "11px" }}>
                                ✓ ОПЛАЧЕН ({order.payment_method === "card" ? "Карта" : "Наличные"})
                              </span>
                            : <button className="btn-cta" style={{ background: "var(--accent)", fontSize: "11px", padding: "5px 10px" }}
                                onClick={() => { setPayingOrder(order); setPayMethod("cash"); }}>
                                💳 Принять оплату
                              </button>
                          }
                          <span style={{ background: st.color, color: st.color === "#bff000" ? "var(--dark)" : "white", padding: "4px 10px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase" }}>
                            {st.label}
                          </span>
                          <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            style={{ padding: "5px 8px", border: "2px solid #1a1a1a", background: "var(--bg)", fontFamily: "Montserrat", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ borderTop: "2px solid #eee", paddingTop: "10px" }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ padding: "3px 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                              <span>{item.name} × {item.quantity}</span>
                              <span style={{ fontWeight: 700 }}>{item.price * item.quantity} ₽</span>
                            </div>
                            {item.addons && item.addons.length > 0 && (
                              <div style={{ fontSize: "12px", color: "#888", paddingLeft: "12px" }}>
                                + {item.addons.join(", ")}
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{ fontWeight: 800, fontSize: "16px", marginTop: "8px", textAlign: "right" }}>Итого: {order.total} ₽</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* ═══ МЕНЮ ══════════════════════════════════════════════════════ */}
        {tab === "menu" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">МЕНЮ</h2>
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }}
                onClick={() => setEditItem({ tag_color: "var(--primary)", available: true, category: "Кофе", tag: "Новинка" })}>
                + Добавить позицию
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {menuItems.map((item) => (
                <div key={item.id} style={{ background: "white", border: "3px solid #1a1a1a", padding: "16px", display: "flex", gap: "16px", alignItems: "flex-start", opacity: item.available ? 1 : 0.55, flexWrap: "wrap" }}>
                  <img src={item.image_url} alt={item.name} style={{ width: "80px", height: "80px", objectFit: "cover", border: "2px solid #1a1a1a", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px" }}>{item.name}</span>
                      <span style={{ fontFamily: "Unbounded", fontWeight: 800, color: "var(--primary)", fontSize: "16px" }}>{item.price} ₽</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{item.category} · {item.tag}</div>
                    <div style={{ fontSize: "13px", color: "#444" }}>{item.description}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                    <button className="btn-cta" style={{ fontSize: "11px", background: "var(--dark)", color: "white", padding: "6px 14px" }} onClick={() => setEditItem(item)}>Изменить</button>
                    <button className="btn-cta" style={{ fontSize: "11px", background: item.available ? "var(--accent)" : "#ddd", padding: "6px 14px" }} onClick={() => toggleMenuAvailable(item)}>
                      {item.available ? "Вкл" : "Выкл"}
                    </button>
                    <button className="btn-cta" style={{ fontSize: "11px", background: "var(--primary)", color: "white", padding: "6px 14px" }} onClick={() => deleteMenuItem(item.id)}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ДОБАВКИ ═══════════════════════════════════════════════════ */}
        {tab === "addons" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">ДОБАВКИ</h2>
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }}
                onClick={() => setEditAddon({ available: true, price: 0 })}>
                + Добавить
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {addons.map((addon) => (
                <div key={addon.id} style={{ background: "white", border: "3px solid #1a1a1a", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", opacity: addon.available ? 1 : 0.5 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "15px" }}>{addon.name}</span>
                    <span style={{ marginLeft: "12px", color: "var(--primary)", fontFamily: "Unbounded", fontWeight: 800 }}>+{addon.price} ₽</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-cta" style={{ fontSize: "11px", background: "var(--dark)", color: "white", padding: "5px 12px" }} onClick={() => setEditAddon(addon)}>Изменить</button>
                    <button className="btn-cta" style={{ fontSize: "11px", background: addon.available ? "var(--accent)" : "#ddd", padding: "5px 12px" }} onClick={() => toggleAddonAvailable(addon)}>
                      {addon.available ? "Вкл" : "Выкл"}
                    </button>
                    <button className="btn-cta" style={{ fontSize: "11px", background: "var(--primary)", color: "white", padding: "5px 12px" }} onClick={() => deleteAddon(addon.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ НАСТРОЙКИ ═════════════════════════════════════════════════ */}
        {tab === "settings" && (
          <div style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className="section-title">НАСТРОЙКИ</h2>
              {settingsDirty && (
                <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaving ? "Сохраняем..." : "Сохранить изменения"}
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "white", border: "3px solid #1a1a1a", padding: "24px" }}>
                <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "14px", marginBottom: "16px", textTransform: "uppercase" }}>Контакты и адрес</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { key: "address", label: "Адрес" },
                    { key: "phone", label: "Телефон" },
                    { key: "email", label: "Email" },
                    { key: "instagram", label: "Instagram" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input style={inputStyle} value={settings[key] || ""} onChange={(e) => setSetting(key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "white", border: "3px solid #1a1a1a", padding: "24px" }}>
                <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "14px", marginBottom: "16px", textTransform: "uppercase" }}>График работы</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Пн–Пт</label>
                    <input style={inputStyle} value={settings["hours_weekdays"] || ""} onChange={(e) => setSetting("hours_weekdays", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Сб–Вс</label>
                    <input style={inputStyle} value={settings["hours_weekends"] || ""} onChange={(e) => setSetting("hours_weekends", e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ background: "white", border: "3px solid #1a1a1a", padding: "24px" }}>
                <div style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "14px", marginBottom: "16px", textTransform: "uppercase" }}>О кафе</div>
                <div>
                  <label style={labelStyle}>Описание</label>
                  <textarea
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                    value={settings["description"] || ""}
                    onChange={(e) => setSetting("description", e.target.value)}
                  />
                </div>
              </div>

              {settingsDirty && (
                <button className="btn-cta" style={{ background: "var(--primary)", color: "white", padding: "16px" }} onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaving ? "Сохраняем..." : "Сохранить изменения"}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ═══ МОДАЛКА: РЕДАКТИРОВАТЬ ПОЗИЦИЮ МЕНЮ ══════════════════════ */}
      {editItem !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", boxShadow: "8px 8px 0 #1a1a1a", padding: "32px", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px", textTransform: "uppercase", marginBottom: "20px" }}>
              {editItem.id ? "Редактировать позицию" : "Новая позиция"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Название", key: "name", type: "text" },
                { label: "Описание", key: "description", type: "text" },
                { label: "Цена (₽)", key: "price", type: "number" },
                { label: "Категория (Кофе, Еда, Напитки…)", key: "category", type: "text" },
                { label: "Тег (Хит, Новинка, Завтрак…)", key: "tag", type: "text" },
                { label: "URL фото", key: "image_url", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type} style={inputStyle}
                    value={(editItem as Record<string, unknown>)[key] as string ?? ""}
                    onChange={(e) => setEditItem({ ...editItem, [key]: type === "number" ? Number(e.target.value) : e.target.value })} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Цвет тега</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={editItem.tag_color || "var(--primary)"}
                  onChange={(e) => setEditItem({ ...editItem, tag_color: e.target.value })}>
                  {TAG_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="avail" checked={!!editItem.available}
                  onChange={(e) => setEditItem({ ...editItem, available: e.target.checked })} style={{ width: "18px", height: "18px" }} />
                <label htmlFor="avail" style={{ fontWeight: 700, cursor: "pointer" }}>Доступно для заказа</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--primary)", color: "white" }} onClick={saveMenuItem} disabled={loading}>
                {loading ? "Сохраняем..." : "Сохранить"}
              </button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setEditItem(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ МОДАЛКА: РЕДАКТИРОВАТЬ ДОБАВКУ ═══════════════════════════ */}
      {editAddon !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", boxShadow: "8px 8px 0 #1a1a1a", padding: "32px", maxWidth: "380px", width: "100%" }}>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px", textTransform: "uppercase", marginBottom: "20px" }}>
              {editAddon.id ? "Редактировать добавку" : "Новая добавка"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Название добавки</label>
                <input type="text" style={inputStyle} value={editAddon.name || ""}
                  onChange={(e) => setEditAddon({ ...editAddon, name: e.target.value })} placeholder="Молоко oat" />
              </div>
              <div>
                <label style={labelStyle}>Цена (₽)</label>
                <input type="number" style={inputStyle} value={editAddon.price ?? 0}
                  onChange={(e) => setEditAddon({ ...editAddon, price: Number(e.target.value) })} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="addon-avail" checked={!!editAddon.available}
                  onChange={(e) => setEditAddon({ ...editAddon, available: e.target.checked })} style={{ width: "18px", height: "18px" }} />
                <label htmlFor="addon-avail" style={{ fontWeight: 700, cursor: "pointer" }}>Доступна</label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--primary)", color: "white" }} onClick={saveAddon} disabled={loading}>
                {loading ? "Сохраняем..." : "Сохранить"}
              </button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setEditAddon(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ МОДАЛКА: ОПЛАТА ЗАКАЗА ════════════════════════════════════ */}
      {payingOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", boxShadow: "8px 8px 0 #1a1a1a", padding: "32px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>💳</div>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px", marginBottom: "8px" }}>ПРИНЯТЬ ОПЛАТУ</h3>
            <div style={{ color: "#666", marginBottom: "4px" }}>{payingOrder.code} · {payingOrder.customer_name}</div>
            <div style={{ fontFamily: "Unbounded", fontSize: "32px", fontWeight: 800, color: "var(--primary)", margin: "16px 0" }}>
              {payingOrder.total} ₽
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button className="btn-cta" style={{ flex: 1, background: payMethod === "cash" ? "var(--dark)" : "white", color: payMethod === "cash" ? "white" : "var(--dark)", fontSize: "13px" }}
                onClick={() => setPayMethod("cash")}>
                💵 Наличные
              </button>
              <button className="btn-cta" style={{ flex: 1, background: payMethod === "card" ? "var(--dark)" : "white", color: payMethod === "card" ? "white" : "var(--dark)", fontSize: "13px" }}
                onClick={() => setPayMethod("card")}>
                💳 Карта
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--primary)", color: "white", padding: "14px" }} onClick={handlePay} disabled={loading}>
                {loading ? "..." : "Подтвердить оплату"}
              </button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setPayingOrder(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
