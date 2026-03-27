"""Создание заказа и получение его статуса по коду"""
import json
import os
import random
import string
import psycopg2


def generate_code():
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"COFFEE-{suffix}"


def handler(event: dict, context) -> dict:
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        customer_name = body.get('customer_name', 'Гость')
        items = body.get('items', [])
        total = body.get('total', 0)

        code = generate_code()
        while True:
            cur.execute("SELECT id FROM orders WHERE code = %s", (code,))
            if not cur.fetchone():
                break
            code = generate_code()

        cur.execute(
            "INSERT INTO orders (code, customer_name, items, total, status) VALUES (%s, %s, %s, %s, 'new') RETURNING id",
            (code, customer_name, json.dumps(items), total)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"code": code, "status": "new"})}

    if method == 'GET' and path != '/':
        code = path.strip('/').upper()
        cur.execute("SELECT code, customer_name, items, total, status, created_at FROM orders WHERE code = %s", (code,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({"error": "Заказ не найден"})}
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            "code": row[0], "customer_name": row[1], "items": row[2],
            "total": row[3], "status": row[4], "created_at": str(row[5])
        })}

    cur.close()
    conn.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({"error": "Not found"})}
