"""Управление меню, добавками, заказами, настройками кафе"""
import json
import os
import psycopg2


def check_auth(event):
    auth = (event.get('headers') or {}).get('X-Authorization', '') or (event.get('headers') or {}).get('authorization', '')
    return auth.startswith('Bearer admin_')


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({"error": "Unauthorized"})}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/').strip('/')
    parts = [p for p in path.split('/') if p]
    body = json.loads(event.get('body') or '{}') if event.get('body') else {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── ORDERS ──────────────────────────────────────────────────────
        if parts and parts[0] == 'orders':

            # GET /orders
            if method == 'GET' and len(parts) == 1:
                cur.execute("""
                    SELECT id, code, customer_name, items, total, status, paid, payment_method, created_at
                    FROM orders ORDER BY created_at DESC LIMIT 200
                """)
                rows = cur.fetchall()
                orders = [{
                    "id": r[0], "code": r[1], "customer_name": r[2],
                    "items": r[3], "total": r[4], "status": r[5],
                    "paid": r[6], "payment_method": r[7], "created_at": str(r[8])
                } for r in rows]
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"orders": orders})}

            # PUT /orders/{id}/status
            if method == 'PUT' and len(parts) == 3 and parts[2] == 'status':
                order_id = int(parts[1])
                status = body.get('status', 'new')
                cur.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

            # PUT /orders/{id}/pay
            if method == 'PUT' and len(parts) == 3 and parts[2] == 'pay':
                order_id = int(parts[1])
                payment_method = body.get('payment_method', 'cash')
                cur.execute(
                    "UPDATE orders SET paid = TRUE, payment_method = %s, status = CASE WHEN status = 'ready' THEN 'done' ELSE status END WHERE id = %s",
                    (payment_method, order_id)
                )
                conn.commit()
                cur.execute("SELECT status, paid, payment_method FROM orders WHERE id = %s", (order_id,))
                row = cur.fetchone()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True, "status": row[0], "paid": row[1], "payment_method": row[2]})}

        # ── MENU ─────────────────────────────────────────────────────────
        if parts and parts[0] == 'menu':

            # GET /menu
            if method == 'GET' and len(parts) == 1:
                cur.execute("SELECT id, name, description, price, tag, tag_color, image_url, category, available FROM menu_items ORDER BY id")
                rows = cur.fetchall()
                items = [{"id": r[0], "name": r[1], "description": r[2], "price": r[3], "tag": r[4], "tag_color": r[5], "image_url": r[6], "category": r[7], "available": r[8]} for r in rows]
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"items": items})}

            # POST /menu
            if method == 'POST' and len(parts) == 1:
                cur.execute(
                    "INSERT INTO menu_items (name, description, price, tag, tag_color, image_url, category, available) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                    (body.get('name'), body.get('description'), int(body.get('price', 0)),
                     body.get('tag', 'Новинка'), body.get('tag_color', 'var(--primary)'),
                     body.get('image_url', ''), body.get('category', 'Кофе'), body.get('available', True))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"id": new_id, "ok": True})}

            # PUT /menu/{id}
            if method == 'PUT' and len(parts) == 2:
                item_id = int(parts[1])
                cur.execute(
                    "UPDATE menu_items SET name=%s, description=%s, price=%s, tag=%s, tag_color=%s, image_url=%s, category=%s, available=%s WHERE id=%s",
                    (body.get('name'), body.get('description'), int(body.get('price', 0)),
                     body.get('tag', 'Новинка'), body.get('tag_color', 'var(--primary)'),
                     body.get('image_url', ''), body.get('category', 'Кофе'), body.get('available', True), item_id)
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

            # DELETE /menu/{id}
            if method == 'DELETE' and len(parts) == 2:
                item_id = int(parts[1])
                cur.execute("DELETE FROM menu_items WHERE id = %s", (item_id,))
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

        # ── ADDONS ───────────────────────────────────────────────────────
        if parts and parts[0] == 'addons':

            # GET /addons
            if method == 'GET' and len(parts) == 1:
                cur.execute("SELECT id, name, price, available FROM addons ORDER BY id")
                rows = cur.fetchall()
                addons = [{"id": r[0], "name": r[1], "price": r[2], "available": r[3]} for r in rows]
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"addons": addons})}

            # POST /addons
            if method == 'POST' and len(parts) == 1:
                cur.execute(
                    "INSERT INTO addons (name, price, available) VALUES (%s, %s, %s) RETURNING id",
                    (body.get('name'), int(body.get('price', 0)), body.get('available', True))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"id": new_id, "ok": True})}

            # PUT /addons/{id}
            if method == 'PUT' and len(parts) == 2:
                addon_id = int(parts[1])
                cur.execute(
                    "UPDATE addons SET name=%s, price=%s, available=%s WHERE id=%s",
                    (body.get('name'), int(body.get('price', 0)), body.get('available', True), addon_id)
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

            # DELETE /addons/{id}
            if method == 'DELETE' and len(parts) == 2:
                addon_id = int(parts[1])
                cur.execute("DELETE FROM addons WHERE id = %s", (addon_id,))
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

        # ── SETTINGS ─────────────────────────────────────────────────────
        if parts and parts[0] == 'settings':

            # GET /settings
            if method == 'GET' and len(parts) == 1:
                cur.execute("SELECT key, value FROM cafe_settings")
                rows = cur.fetchall()
                settings = {r[0]: r[1] for r in rows}
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"settings": settings})}

            # PUT /settings
            if method == 'PUT' and len(parts) == 1:
                for key, value in body.items():
                    cur.execute(
                        "INSERT INTO cafe_settings (key, value, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                        (key, str(value))
                    )
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({"error": "Not found"})}
