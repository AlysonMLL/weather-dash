import httpx
import json
from datetime import datetime, timedelta
from fastapi import HTTPException
from database import get_connection

API_KEY = "7babb836218eaa39d9b8557b33fc51e6"
WEATHER_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"
GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

async def fetch_weather_data(city: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Tenta pegar do cache
    cursor.execute("SELECT * FROM weather WHERE city = ?", (city.lower(),))
    row = cursor.fetchone()
    now = datetime.now()
    
    if row:
        updated_at = datetime.fromisoformat(row[6])
        if now - updated_at < timedelta(minutes=15):
            conn.close()
            return {
                "city": row[0].title(), "temp": row[1], "feels_like": row[2],
                "humidity": row[3], "wind_speed": row[4], "description": row[5],
                "source": "cache_interno"
            }

    # 2. Busca na API externa
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{WEATHER_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            conn.close()
            raise HTTPException(status_code=resp.status_code, detail=f"Erro: {resp.json()}")
        data = resp.json()

    # 3. Transforma e Salva
    weather_data = {
        "city": city.lower(),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "description": data["weather"][0]["description"]
    }

    cursor.execute("""
        INSERT INTO weather (city, temp, feels_like, humidity, wind_speed, description, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET
            temp=excluded.temp, feels_like=excluded.feels_like, humidity=excluded.humidity,
            wind_speed=excluded.wind_speed, description=excluded.description, updated_at=excluded.updated_at
    """, (
        weather_data["city"], weather_data["temp"], weather_data["feels_like"],
        weather_data["humidity"], weather_data["wind_speed"], weather_data["description"], now.isoformat()
    ))
    conn.commit()
    conn.close()

    weather_data["city"] = weather_data["city"].title()
    weather_data["source"] = "api_externa"
    return weather_data

async def fetch_forecast_data(city: str):
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

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FORECAST_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            conn.close()
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar previsão")
        data = resp.json()

    clean_forecast = [{
        "time": item["dt_txt"][11:16], 
        "temp": round(item["main"]["temp"], 1),
        "humidity": item["main"]["humidity"],
        "description": item["weather"][0]["description"].title()
    } for item in data["list"][:8]]

    cursor.execute("""
        INSERT INTO forecast (city, forecast_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET forecast_data=excluded.forecast_data, updated_at=excluded.updated_at
    """, (city.lower(), json.dumps(clean_forecast), now.isoformat()))
    conn.commit()
    conn.close()

    return {"city": city.title(), "forecast": clean_forecast, "source": "api_externa"}

async def fetch_city_suggestions(query: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{GEO_URL}?q={query}&limit=5&appid={API_KEY}")
        if resp.status_code != 200:
            return []
            
        return [{
            "name": item.get("name"), 
            "display": f"{item.get('name')}{', ' + item.get('state') if item.get('state') else ''} - {item.get('country', '')}"
        } for item in resp.json()]