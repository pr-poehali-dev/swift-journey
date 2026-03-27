"""Управление меню и заказами: просмотр, редактирование, смена статусов"""
import json
import os
import psycopg2


def check_auth(event):
    auth = event.get('headers', {}).get('X-Authorization', '') or event.get('headers', {}).get('authorization', '')
    return auth.startswith('Bearer admin_')


def handler(event: dict, context) -> dict:
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({"error": "Unauthorized"})}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/').strip('/')
    parts = path.split('/')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        # GET /orders
        if method == 'GET' and parts[0] == 'orders':
            cur.execute("SELECT id, code, customer_name, items, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 100")
            rows = cur.fetchall()
            orders = [{"id": r[0], "code": r[1], "customer_name": r[2], "items": r[3], "total": r[4], "status": r[5], "created_at": str(r[6])} for r in rows]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"orders": orders})}

        # PUT /orders/{id}/status
        if method == 'PUT' and len(parts) >= 3 and parts[0] == 'orders' and parts[2] == 'status':
            order_id = int(parts[1])
            body = json.loads(event.get('body') or '{}')
            status = body.get('status', 'new')
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

        # GET /menu
        if method == 'GET' and parts[0] == 'menu':
            cur.execute("SELECT id, name, description, price, tag, tag_color, image_url, category, available FROM menu_items ORDER BY id")
            rows = cur.fetchall()
            items = [{"id": r[0], "name": r[1], "description": r[2], "price": r[3], "tag": r[4], "tag_color": r[5], "image_url": r[6], "category": r[7], "available": r[8]} for r in rows]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"items": items})}

        # POST /menu
        if method == 'POST' and parts[0] == 'menu':
            body = json.loads(event.get('body') or '{}')
            cur.execute(
                "INSERT INTO menu_items (name, description, price, tag, tag_color, image_url, category, available) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get('name'), body.get('description'), body.get('price', 0), body.get('tag', 'Новинка'), body.get('tag_color', 'var(--primary)'), body.get('image_url', ''), body.get('category', 'Кофе'), body.get('available', True))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"id": new_id, "ok": True})}

        # PUT /menu/{id}
        if method == 'PUT' and len(parts) >= 2 and parts[0] == 'menu':
            item_id = int(parts[1])
            body = json.loads(event.get('body') or '{}')
            cur.execute(
                "UPDATE menu_items SET name=%s, description=%s, price=%s, tag=%s, tag_color=%s, image_url=%s, category=%s, available=%s WHERE id=%s",
                (body.get('name'), body.get('description'), body.get('price', 0), body.get('tag', 'Новинка'), body.get('tag_color', 'var(--primary)'), body.get('image_url', ''), body.get('category', 'Кофе'), body.get('available', True), item_id)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

        # DELETE /menu/{id}
        if method == 'DELETE' and len(parts) >= 2 and parts[0] == 'menu':
            item_id = int(parts[1])
            cur.execute("DELETE FROM menu_items WHERE id = %s", (item_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"ok": True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({"error": "Not found"})}
