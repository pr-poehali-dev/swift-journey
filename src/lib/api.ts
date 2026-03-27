const MENU_URL = "https://functions.poehali.dev/2e886809-aae7-4a46-81ec-165103d5abec";
const ORDERS_URL = "https://functions.poehali.dev/f33e59d4-e0db-4324-9d08-1d4bc99da374";
const ADMIN_LOGIN_URL = "https://functions.poehali.dev/602256e6-9da5-4d30-9979-e19acad8f974";
const ADMIN_PANEL_URL = "https://functions.poehali.dev/d53ef8a2-651e-4273-af39-ae1c9b4a3b08";

export const api = {
  menu: {
    getAll: () => fetch(MENU_URL),
  },
  orders: {
    create: (body: object) => fetch(ORDERS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    getByCode: (code: string) => fetch(`${ORDERS_URL}/${code}`),
  },
  admin: {
    login: (body: object) => fetch(ADMIN_LOGIN_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    getOrders: (token: string) => fetch(`${ADMIN_PANEL_URL}/orders`, { headers: { "Authorization": `Bearer ${token}` } }),
    updateOrderStatus: (token: string, id: number, status: string) =>
      fetch(`${ADMIN_PANEL_URL}/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ status }) }),
    getMenu: (token: string) => fetch(`${ADMIN_PANEL_URL}/menu`, { headers: { "Authorization": `Bearer ${token}` } }),
    createMenuItem: (token: string, body: object) => fetch(`${ADMIN_PANEL_URL}/menu`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) }),
    updateMenuItem: (token: string, id: number, body: object) => fetch(`${ADMIN_PANEL_URL}/menu/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) }),
    deleteMenuItem: (token: string, id: number) => fetch(`${ADMIN_PANEL_URL}/menu/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }),
  },
};
