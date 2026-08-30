"""
O que há aqui:
- get_weather_cache(city)
- save_weather_cache(data)
- get_forecast_cache(city)
- save_forecast_cache(city, forecast_data)
- get_all_weather_data() (Para a exportação)

Função do arquivo: Abstrair todas as operações de banco de dados (CRUD).
Ele verifica validades (TTL) de 15min e 30min e executa as queries SQL, 
isolando o banco das chamadas de rede.
"""

import json
from datetime import datetime, timedelta

try:
    from backend.database import get_connection
except ModuleNotFoundError:  # fallback para execução direta
    from database import get_connection

def get_weather_cache(city: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM weather WHERE city = ?", (city.lower(),))
    row = cursor.fetchone()
    now = datetime.now()
    
    if row:
        updated_at = datetime.fromisoformat(row[7])
        if now - updated_at < timedelta(minutes=15):
            conn.close()
            return {
                "city": row[0].title(), "temp": row[1], "feels_like": row[2],
                "humidity": row[3], "wind_speed": row[4], "description": row[5],
                "timezone": row[6], "source": "cache_interno"
            }
    conn.close()
    return None

def save_weather_cache(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO weather (city, temp, feels_like, humidity, wind_speed, description, timezone, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET
            temp=excluded.temp, feels_like=excluded.feels_like, humidity=excluded.humidity,
            wind_speed=excluded.wind_speed, description=excluded.description, timezone=excluded.timezone, updated_at=excluded.updated_at
    """, (
        data["city"], data["temp"], data["feels_like"],
        data["humidity"], data["wind_speed"], data["description"], 
        data["timezone"], now
    ))
    conn.commit()
    conn.close()

def get_forecast_cache(city: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT forecast_data, updated_at FROM forecast WHERE city = ?", (city.lower(),))
    row = cursor.fetchone()
    now = datetime.now()
    
    if row:
        updated_at = datetime.fromisoformat(row[1])
        if now - updated_at < timedelta(minutes=30):
            conn.close()
            return {"city": city.title(), "forecast": json.loads(row[0]), "source": "cache_interno"}
    conn.close()
    return None

def save_forecast_cache(city: str, forecast_data: list):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO forecast (city, forecast_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET forecast_data=excluded.forecast_data, updated_at=excluded.updated_at
    """, (city.lower(), json.dumps(forecast_data), now))
    conn.commit()
    conn.close()

def get_all_weather_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT city, temp, feels_like, humidity, wind_speed, description, updated_at FROM weather")
    rows = cursor.fetchall()
    conn.close()
    return rows