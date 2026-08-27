import sqlite3
import httpx
import json
from fastapi import FastAPI, HTTPException
from datetime import datetime, timedelta
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/src", StaticFiles(directory="src"), name="src")

@app.get("/")
async def root():
    return FileResponse("index.html")

# Configurações da API Externa
API_KEY = "7babb836218eaa39d9b8557b33fc51e6"
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"

def init_db():
    conn = sqlite3.connect("weather_cache.db")
    cursor = conn.cursor()
    # Tabela com as colunas que nosso frontend vai precisar
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather (
            city TEXT PRIMARY KEY,
            temp REAL,
            feels_like REAL,
            humidity INTEGER,
            wind_speed REAL,
            description TEXT,
            updated_at DATETIME
        )
    """)
    # Nova tabela para o cache das previsões (Gráficos)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecast (
            city TEXT PRIMARY KEY,
            forecast_data TEXT,
            updated_at DATETIME
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.get("/api/weather/{city}")
async def get_weather(city: str):
    conn = sqlite3.connect("weather_cache.db")
    cursor = conn.cursor()
    
    # 1. Verifica no Cache (Banco de Dados)
    cursor.execute("SELECT * FROM weather WHERE city = ?", (city.lower(),))
    row = cursor.fetchone()
    now = datetime.now()
    
    if row:
        updated_at = datetime.fromisoformat(row[6])
        # Regra de Negócio: Se o dado tem menos de 15 minutos, usa o cache
        if now - updated_at < timedelta(minutes=15):
            conn.close()
            return {
                "city": row[0].title(),
                "temp": row[1],
                "feels_like": row[2],
                "humidity": row[3],
                "wind_speed": row[4],
                "description": row[5],
                "source": "cache_interno" # Mostra de onde o dado veio
            }

    # 2. Extração: Se não tem cache ou está velho, busca na API externa
    async with httpx.AsyncClient() as client:
        # Passamos units=metric para Celsius e lang=pt_br para português
        resp = await client.get(f"{BASE_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        
        if resp.status_code != 200:
            conn.close()
            # Isso vai mostrar a mensagem real de erro enviada por eles
            mensagem_erro_real = resp.json()
            raise HTTPException(status_code=resp.status_code, detail=f"Erro do OpenWeatherMap: {mensagem_erro_real}")
            
        data = resp.json()

    # 3. Transformação: Limpa o JSON gigante e pega só o que importa
    weather_data = {
        "city": city.lower(),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "description": data["weather"][0]["description"]
    }

    # 4. Carga: Salva/Atualiza no nosso banco de dados local
    cursor.execute("""
        INSERT INTO weather (city, temp, feels_like, humidity, wind_speed, description, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET
            temp=excluded.temp,
            feels_like=excluded.feels_like,
            humidity=excluded.humidity,
            wind_speed=excluded.wind_speed,
            description=excluded.description,
            updated_at=excluded.updated_at
    """, (
        weather_data["city"], weather_data["temp"], weather_data["feels_like"],
        weather_data["humidity"], weather_data["wind_speed"], weather_data["description"], 
        now.isoformat()
    ))
    
    conn.commit()
    conn.close()

    # Formata a cidade com letra maiúscula para devolver ao frontend
    weather_data["city"] = weather_data["city"].title()
    weather_data["source"] = "api_externa"
    
    return weather_data

@app.get("/api/forecast/{city}")
async def get_forecast(city: str):
    conn = sqlite3.connect("weather_cache.db")
    cursor = conn.cursor()
    
    # 1. Verifica no Cache
    cursor.execute("SELECT forecast_data, updated_at FROM forecast WHERE city = ?", (city.lower(),))
    row = cursor.fetchone()
    now = datetime.now()
    
    if row:
        updated_at = datetime.fromisoformat(row[1])
        if now - updated_at < timedelta(minutes=30): # Cache de 30 min para previsões
            conn.close()
            # Converte de volta de String(JSON) para Lista Python
            return {"city": city.title(), "forecast": json.loads(row[0]), "source": "cache_interno"}

    # 2. Extração: Busca na API externa (Endpoint /forecast)
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        
        if resp.status_code != 200:
            conn.close()
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar previsão")
            
        data = resp.json()

    # 3. Transformação: Pega apenas as próximas 8 medições (24 horas)
    clean_forecast = []
    for item in data["list"][:8]:
        clean_forecast.append({
            # Extrai apenas a hora da string "2026-08-27 15:00:00" -> "15:00"
            "time": item["dt_txt"][11:16], 
            "temp": round(item["main"]["temp"], 1),
            "humidity": item["main"]["humidity"],
            "description": item["weather"][0]["description"].title()
        })

    # 4. Carga: Salva a lista limpa como texto JSON no banco
    forecast_json_str = json.dumps(clean_forecast)
    cursor.execute("""
        INSERT INTO forecast (city, forecast_data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(city) DO UPDATE SET
            forecast_data=excluded.forecast_data,
            updated_at=excluded.updated_at
    """, (city.lower(), forecast_json_str, now.isoformat()))
    
    conn.commit()
    conn.close()

    return {"city": city.title(), "forecast": clean_forecast, "source": "api_externa"}