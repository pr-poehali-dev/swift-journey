"""Публичное меню, добавки и настройки кафе"""
import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    path = event.get('path', '/').strip('/')
    parts = [p for p in path.split('/') if p]

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        # GET /addons
        if parts and parts[0] == 'addons':
            cur.execute("SELECT id, name, price FROM addons WHERE available = TRUE ORDER BY id")
            rows = cur.fetchall()
            addons = [{"id": r[0], "name": r[1], "price": r[2]} for r in rows]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"addons": addons})}

        # GET /settings
        if parts and parts[0] == 'settings':
            cur.execute("SELECT key, value FROM cafe_settings")
            rows = cur.fetchall()
            settings = {r[0]: r[1] for r in rows}
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"settings": settings})}

        # GET / — все позиции меню
        cur.execute("SELECT id, name, description, price, tag, tag_color, image_url, category, available FROM menu_items ORDER BY id")
        rows = cur.fetchall()
        items = [
            {"id": r[0], "name": r[1], "description": r[2], "price": r[3],
             "tag": r[4], "tag_color": r[5], "image_url": r[6], "category": r[7], "available": r[8]}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"items": items})}

    finally:
        cur.close()
        conn.close()
