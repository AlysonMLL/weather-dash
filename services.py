import httpx
import json
from datetime import datetime, timedelta
from fastapi import HTTPException
from database import get_connection
from collections import defaultdict

API_KEY = "7babb836218eaa39d9b8557b33fc51e6"
WEATHER_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"
GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

async def fetch_weather_data(city: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Tenta pegar do cache (Note que agora lemos a coluna timezone [6])
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

    # 2. Busca na API externa
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{WEATHER_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            conn.close()
            raise HTTPException(status_code=resp.status_code, detail=f"Erro: {resp.json()}")
        data = resp.json()

    # 3. Transforma e Salva (Adicionamos o timezone extraído da API)
    weather_data = {
        "city": city.lower(),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "description": data["weather"][0]["description"],
        "timezone": data["timezone"]
    }

    cursor.execute("""
        INSERT INTO weather (city, temp, feels_like, humidity, wind_speed, description, timezone, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET
            temp=excluded.temp, feels_like=excluded.feels_like, humidity=excluded.humidity,
            wind_speed=excluded.wind_speed, description=excluded.description, timezone=excluded.timezone, updated_at=excluded.updated_at
    """, (
        weather_data["city"], weather_data["temp"], weather_data["feels_like"],
        weather_data["humidity"], weather_data["wind_speed"], weather_data["description"], 
        weather_data["timezone"], now.isoformat()
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

async def fetch_extended_forecast(city: str):
    """
    ETL Avançado: Busca 5 dias de previsão (em saltos de 3h), 
    agrupa por dia, calcula a mínima/máxima e extrai o clima predominante.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FORECAST_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar previsão estendida")
        data = resp.json()

    # 1. Agrupamento (Map)
    # Agrupa as 40 medições usando a data (YYYY-MM-DD) como chave
    daily_data = defaultdict(list)
    for item in data["list"]:
        date_str = item["dt_txt"][:10]  # Pega apenas os 10 primeiros caracteres: '2026-08-29'
        daily_data[date_str].append(item)

    # 2. Redução e Transformação (Reduce)
    extended_forecast = []
    for date_str, readings in daily_data.items():
        if len(extended_forecast) >= 5: # Garante que só teremos os 5 dias
            break
            
        # Calcula Min e Max iterando por todas as leituras daquele dia
        temps = [r["main"]["temp"] for r in readings]
        temp_min = min(temps)
        temp_max = max(temps)
        
        # Para a condição climática (ensolarado, chuva), tentamos pegar a leitura 
        # do meio-dia (12:00:00). Se o dia não tiver leitura ao meio-dia, pegamos a primeira.
        midday_reading = next((r for r in readings if "12:00:00" in r["dt_txt"]), readings[0])
        description = midday_reading["weather"][0]["description"].title()
        
        # Formata a data de "YYYY-MM-DD" para "DD/MM" para ficar bonito na tela
        ano, mes, dia = date_str.split("-")
        data_formatada = f"{dia}/{mes}"

        extended_forecast.append({
            "date": data_formatada,
            "temp_min": round(temp_min, 1),
            "temp_max": round(temp_max, 1),
            "description": description
        })

    return {"city": city.title(), "extended_forecast": extended_forecast}