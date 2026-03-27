"""Авторизация администратора по логину и коду"""
import json
import os
import secrets
import psycopg2


def handler(event: dict, context) -> dict:
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    login = body.get('login', '').strip()
    code = body.get('code', '').strip()

    if not login or not code:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({"error": "Укажите логин и код"})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("SELECT id FROM admins WHERE login = %s AND code_hash = %s", (login, code))
    admin = cur.fetchone()
    cur.close()
    conn.close()

    if not admin:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({"error": "Неверный логин или код"})}

    token = f"admin_{secrets.token_hex(32)}"
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({"token": token, "login": login})}
