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
}

interface OrderItem {
  item: MenuItem;
  qty: number;
  selectedAddons: Addon[];
}

export default function Index() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [addingAddonFor, setAddingAddonFor] = useState<MenuItem | null>(null);
  const [pickedAddons, setPickedAddons] = useState<Addon[]>([]);
  const [orderCode, setOrderCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchAddons();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.menu.getAll();
      const data = await res.json();
      setMenuItems(data.items || []);
    } catch {
      setMenuItems(defaultMenu);
    }
  };

  const fetchAddons = async () => {
    try {
      const res = await api.menu.getAddons();
      const data = await res.json();
      setAddons(data.addons || []);
    } catch { /* ignore */ }
  };

  // При нажатии «В заказ» — открываем выбор добавок
  const handleAddToOrder = (item: MenuItem) => {
    if (addons.length === 0) {
      addToOrderDirect(item, []);
    } else {
      setAddingAddonFor(item);
      setPickedAddons([]);
    }
  };

  const addToOrderDirect = (item: MenuItem, selectedAddons: Addon[]) => {
    setOrderItems((prev) => {
      const exists = prev.find((o) => o.item.id === item.id);
      if (exists) {
        return prev.map((o) => o.item.id === item.id ? { ...o, qty: o.qty + 1 } : o);
      }
      return [...prev, { item, qty: 1, selectedAddons }];
    });
    setShowOrder(true);
    setAddingAddonFor(null);
  };

  const confirmAddons = () => {
    if (!addingAddonFor) return;
    addToOrderDirect(addingAddonFor, pickedAddons);
  };

  const toggleAddon = (addon: Addon) => {
    setPickedAddons((prev) =>
      prev.find((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]
    );
  };

  const removeFromOrder = (id: number) => {
    setOrderItems((prev) => prev.filter((o) => o.item.id !== id));
  };

  const totalPrice = orderItems.reduce((sum, o) => {
    const addonsTotal = o.selectedAddons.reduce((s, a) => s + a.price, 0);
    return sum + (o.item.price + addonsTotal) * o.qty;
  }, 0);

  const submitOrder = async () => {
    if (!customerName.trim()) return;
    setLoading(true);
    try {
      const res = await api.orders.create({
        customer_name: customerName,
        items: orderItems.map((o) => ({
          menu_item_id: o.item.id,
          quantity: o.qty,
          name: o.item.name,
          price: o.item.price + o.selectedAddons.reduce((s, a) => s + a.price, 0),
          addons: o.selectedAddons.map((a) => a.name),
        })),
        total: totalPrice,
      });
      const data = await res.json();
      setOrderCode(data.code);
      setOrderSuccess(true);
      setOrderItems([]);
      setShowOrder(false);
    } catch {
      alert("Ошибка при оформлении заказа. Попробуйте ещё раз.");
    }
    setLoading(false);
  };

  const displayMenu = menuItems.length > 0 ? menuItems : defaultMenu;

  return (
    <>
      <div className="grain-overlay" />

      <header className="header">
        <div className="logo">COFFEE★</div>
        <nav>
          <a href="#menu">Меню</a>
          <a href="#about">О нас</a>
          <a href="#track">Отследить</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <button className="btn-cta" onClick={() => setShowOrder(true)}>
          Заказать {orderItems.length > 0 && `(${orderItems.reduce((s, o) => s + o.qty, 0)})`}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              ТВОЙ КОФЕ,
              <br />
              ТВОЙ <span>РИТМ</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed text-[#555]">
              Ретро-атмосфера 70-х, свежеобжаренный кофе и завтраки весь день. Место, где время замедляется ровно настолько, чтобы насладиться каждым глотком.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
                Смотреть меню
              </button>
              <button className="btn-cta" style={{ background: "white" }} onClick={() => document.getElementById("track")?.scrollIntoView({ behavior: "smooth" })}>
                Отследить заказ
              </button>
            </div>
          </div>
          <div className="hero-img" style={{ background: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80') center center / cover" }}>
            <div className="sticker">СВЕЖИЙ<br />КАЖДЫЙ ДЕНЬ</div>
            <div className="floating-tag hidden md:block" style={{ top: "20%", left: "10%" }}>#COFFEETIME</div>
            <div className="floating-tag hidden md:block" style={{ bottom: "30%", right: "20%" }}>HOT ☕</div>
          </div>
        </section>

        <div className="marquee">
          <div className="marquee-content">
            &nbsp; * ЭСПРЕССО КОТОРЫЙ БОДРИТ * КАПУЧИНО КАК В ИТАЛИИ * ЗАВТРАКИ ВЕСЬ ДЕНЬ * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КОФЕ В ГОРОДЕ *
            ЭСПРЕССО КОТОРЫЙ БОДРИТ * КАПУЧИНО КАК В ИТАЛИИ * ЗАВТРАКИ ВЕСЬ ДЕНЬ * ОТКРЫТЫ С 8:00 * ЛУЧШИЙ КОФЕ В ГОРОДЕ
          </div>
        </div>

        <section className="section-padding" id="menu">
          <div className="section-header">
            <h2 className="section-title">НАШЕ МЕНЮ</h2>
            <span className="text-sm md:text-base" style={{ color: "var(--dark)", fontWeight: 800, textTransform: "uppercase" }}>
              {displayMenu.filter(i => i.available !== false).length} позиций
            </span>
          </div>
          <div className="menu-grid">
            {displayMenu.filter(i => i.available !== false).map((item) => (
              <div className="menu-card" key={item.id}>
                <span className="menu-tag" style={{ background: item.tag_color || "var(--primary)", color: item.tag_color === "var(--accent)" ? "var(--dark)" : "white" }}>
                  {item.tag}
                </span>
                <img src={item.image_url} alt={item.name} />
                <div className="menu-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3>{item.name}</h3>
                    <span className="price">{item.price} ₽</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>{item.description}</p>
                  <button className="btn-cta" style={{ width: "100%", background: "var(--dark)", color: "white", fontSize: "12px" }} onClick={() => handleAddToOrder(item)}>
                    + В заказ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="retro-vibe" id="about">
          <div>
            <h2 className="vibe-title">АТМОСФЕРА.<br />ПРОВЕРЕНО.</h2>
            <p className="vibe-text">
              Мы не просто варим кофе. Мы создаём ритуал. Виниловые пластинки, деревянные столы и запах свежемолотого зерна — каждый уголок продуман для твоего идеального утра. Заходи без брони, просто с хорошим настроением.
            </p>
            <button className="btn-cta" style={{ background: "var(--dark)", color: "white", borderColor: "white" }}>Наша история</button>
          </div>
          <div className="vibe-img"></div>
        </section>

        <section className="section-padding" id="track" style={{ background: "#fff", borderTop: "var(--border)", borderBottom: "var(--border)" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <h2 className="section-title" style={{ marginBottom: "16px" }}>СТАТУС ЗАКАЗА</h2>
            <p style={{ color: "#666", marginBottom: "40px", fontWeight: 600 }}>Введите код заказа, чтобы узнать статус</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <input type="text" placeholder="Например: COFFEE-1234" value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                style={{ flex: 1, minWidth: "200px", padding: "12px 16px", border: "var(--border)", background: "var(--bg)", fontFamily: "Montserrat", fontWeight: 700, fontSize: "16px", outline: "none" }} />
              <button className="btn-cta" style={{ background: "var(--primary)", color: "white" }} onClick={() => trackCode && navigate(`/track/${trackCode}`)}>Найти</button>
            </div>
          </div>
        </section>

        <section className="section-padding" id="contacts">
          <h2 className="section-title" style={{ marginBottom: "40px", textAlign: "center" }}>@COFFEE.CAFE</h2>
          <div className="social-grid">
            {[
              "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80",
              "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80",
            ].map((src, i) => (
              <div className="social-item" key={i}><img src={src} alt={`Кофе ${i + 1}`} /></div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div>
          <div className="footer-logo">COFFEE★</div>
          <p style={{ color: "#666", lineHeight: 1.6 }}>Твоё кофе-место в стиле ретро. Свежеобжаренный кофе, завтраки весь день и атмосфера как в 70-х.</p>
        </div>
        <div className="footer-links">
          <h4>Навигация</h4>
          <ul>
            <li><a href="#menu" style={{ color: "inherit", textDecoration: "none" }}>Меню</a></li>
            <li><a href="#about" style={{ color: "inherit", textDecoration: "none" }}>О нас</a></li>
            <li><a href="#track" style={{ color: "inherit", textDecoration: "none" }}>Отследить заказ</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Часы работы</h4>
          <ul>
            <li>Пн–Пт: 08:00–22:00</li>
            <li>Сб–Вс: 09:00–23:00</li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Контакты</h4>
          <ul>
            <li>+7 (999) 000-00-00</li>
            <li>hello@coffee.cafe</li>
            <li>ул. Кофейная, 1</li>
          </ul>
        </div>
      </footer>

      {/* ═══ ВЫБОР ДОБАВОК ═════════════════════════════════════════════ */}
      {addingAddonFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", boxShadow: "8px 8px 0 #1a1a1a", padding: "32px", maxWidth: "400px", width: "100%" }}>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px", textTransform: "uppercase", marginBottom: "6px" }}>Добавки</h3>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>{addingAddonFor.name} — {addingAddonFor.price} ₽</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {addons.map((addon) => {
                const picked = !!pickedAddons.find((a) => a.id === addon.id);
                return (
                  <div key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: `3px solid ${picked ? "var(--primary)" : "#ddd"}`, background: picked ? "#fff5f0" : "white", cursor: "pointer", transition: "0.15s" }}>
                    <span style={{ fontWeight: 700 }}>{addon.name}</span>
                    <span style={{ fontWeight: 800, color: "var(--primary)" }}>+{addon.price} ₽</span>
                  </div>
                );
              })}
            </div>
            {pickedAddons.length > 0 && (
              <div style={{ background: "#f5f5f5", padding: "8px 12px", marginBottom: "12px", fontSize: "13px", fontWeight: 700 }}>
                Добавки: +{pickedAddons.reduce((s, a) => s + a.price, 0)} ₽
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--dark)", color: "white" }} onClick={confirmAddons}>Добавить в заказ</button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setAddingAddonFor(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ КОРЗИНА ═══════════════════════════════════════════════════ */}
      {showOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", borderBottom: "none", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "18px", textTransform: "uppercase" }}>Ваш заказ</h3>
              <button onClick={() => setShowOrder(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", fontWeight: 800 }}>✕</button>
            </div>
            {orderItems.length === 0
              ? <p style={{ color: "#666", textAlign: "center", padding: "40px 0" }}>Корзина пуста. Добавьте что-нибудь!</p>
              : <>
                {orderItems.map((o) => {
                  const addonsTotal = o.selectedAddons.reduce((s, a) => s + a.price, 0);
                  return (
                    <div key={o.item.id} style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{o.item.name} × {o.qty}</div>
                          {o.selectedAddons.length > 0 && (
                            <div style={{ fontSize: "12px", color: "#888" }}>+ {o.selectedAddons.map(a => a.name).join(", ")}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontWeight: 800 }}>{(o.item.price + addonsTotal) * o.qty} ₽</span>
                          <button onClick={() => removeFromOrder(o.item.id)} style={{ background: "var(--primary)", color: "white", border: "none", width: "22px", height: "22px", cursor: "pointer", fontWeight: 800, fontSize: "12px" }}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px", textAlign: "right" }}>Итого: {totalPrice} ₽</div>
                <input type="text" placeholder="Ваше имя" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "3px solid #1a1a1a", background: "white", fontFamily: "Montserrat", fontWeight: 700, fontSize: "16px", marginBottom: "10px", outline: "none" }} />
                <button className="btn-cta" style={{ width: "100%", background: "var(--primary)", color: "white", padding: "16px" }}
                  onClick={submitOrder} disabled={loading || !customerName.trim()}>
                  {loading ? "Оформляем..." : "Оформить заказ"}
                </button>
              </>
            }
          </div>
        </div>
      )}

      {/* ═══ УСПЕШНЫЙ ЗАКАЗ ════════════════════════════════════════════ */}
      {orderSuccess && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--bg)", border: "3px solid #1a1a1a", boxShadow: "var(--shadow)", padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>☕</div>
            <h3 style={{ fontFamily: "Unbounded", fontWeight: 800, fontSize: "20px", textTransform: "uppercase", marginBottom: "12px" }}>Заказ принят!</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>Ваш код для отслеживания:</p>
            <div style={{ background: "var(--dark)", color: "var(--accent)", fontFamily: "Unbounded", fontSize: "28px", fontWeight: 800, padding: "20px", letterSpacing: "4px", marginBottom: "20px" }}>
              {orderCode}
            </div>
            <p style={{ color: "#666", fontSize: "13px", marginBottom: "20px" }}>Сохраните код — по нему вы сможете отслеживать статус</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-cta" style={{ flex: 1, background: "var(--primary)", color: "white" }} onClick={() => navigate(`/track/${orderCode}`)}>Отследить</button>
              <button className="btn-cta" style={{ flex: 1, background: "white" }} onClick={() => setOrderSuccess(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const defaultMenu: MenuItem[] = [
  { id: 1, name: "Эспрессо", description: "Крепкий, насыщенный, классический. Обжарка 100% арабики из Эфиопии.", price: 180, tag: "Хит", tag_color: "var(--primary)", image_url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80", category: "Кофе", available: true },
  { id: 2, name: "Капучино", description: "Двойной эспрессо, нежная молочная пена и немного корицы по желанию.", price: 260, tag: "Популярное", tag_color: "var(--secondary)", image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80", category: "Кофе", available: true },
  { id: 3, name: "Латте с ванилью", description: "Мягкий кофе с натуральным ванильным сиропом и бархатным молоком.", price: 290, tag: "Новинка", tag_color: "var(--accent)", image_url: "https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=600&q=80", category: "Кофе", available: true },
  { id: 4, name: "Круассан с сыром", description: "Слоёный круассан с сыром бри и прованскими травами. Выпекаем каждое утро.", price: 220, tag: "Завтрак", tag_color: "var(--primary)", image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80", category: "Еда", available: true },
  { id: 5, name: "Авокадо-тост", description: "Хрустящий хлеб на закваске, авокадо, яйцо пашот и микрозелень.", price: 380, tag: "Завтрак", tag_color: "var(--primary)", image_url: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80", category: "Еда", available: true },
  { id: 6, name: "Лимонад Ретро", description: "Домашний лимонад с имбирём, мятой и газированной водой. Никаких консервантов.", price: 240, tag: "Без кофеина", tag_color: "var(--accent)", image_url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80", category: "Напитки", available: true },
];
