"""Получение списка позиций меню для отображения на сайте"""
import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, price, tag, tag_color, image_url, category, available FROM menu_items ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    items = [
        {"id": r[0], "name": r[1], "description": r[2], "price": r[3],
         "tag": r[4], "tag_color": r[5], "image_url": r[6], "category": r[7], "available": r[8]}
        for r in rows
    ]
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"items": items})}
