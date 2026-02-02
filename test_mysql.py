"""Script de teste de conexão MySQL - use variáveis do .env"""
import os

import pymysql
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(
    host=os.getenv("MYSQL_SERVER", "localhost"),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", ""),  # obrigatório no .env
    port=int(os.getenv("MYSQL_PORT", "3306")),
    database=os.getenv("MYSQL_DB", "hr_system"),
)
print("Conexão OK!")
conn.close()