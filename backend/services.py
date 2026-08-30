"""
O que há aqui:
- fetch_weather_data(city)
- fetch_forecast_data(city)
- fetch_city_suggestions(query)
- fetch_extended_forecast(city)
- fetch_weather_by_coords(lat, lon)

Função do arquivo: Lidar puramente com a regra de negócio (ETL) e com o consumo 
da API externa do OpenWeatherMap. Ele orquestra os dados entre o CRUD e o Frontend.
"""

import os
import httpx
from collections import defaultdict
from fastapi import HTTPException
from dotenv import load_dotenv

try:
    from backend import crud
except ModuleNotFoundError:  # fallback para execução direta
    import crud

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not API_KEY:
    raise ValueError("Chave da API não encontrada. Verifique o arquivo .env!")

WEATHER_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"
GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

async def fetch_weather_data(city: str):
    # 1. Checa o cache primeiro (sem escrever uma linha de SQL)
    cached_data = crud.get_weather_cache(city)
    if cached_data:
        return cached_data

    # 2. Se não tiver, busca na API
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{WEATHER_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Erro: {resp.json()}")
        data = resp.json()

    # 3. Limpa (Transformação)
    weather_data = {
        "city": city.lower(),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "description": data["weather"][0]["description"],
        "timezone": data["timezone"]
    }

    # 4. Salva usando o CRUD e retorna
    crud.save_weather_cache(weather_data)
    weather_data["city"] = weather_data["city"].title()
    weather_data["source"] = "api_externa"
    return weather_data

async def fetch_forecast_data(city: str):
    cached_data = crud.get_forecast_cache(city)
    if cached_data:
        return cached_data

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FORECAST_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar previsão")
        data = resp.json()

    clean_forecast = [{
        "time": item["dt_txt"][11:16], 
        "temp": round(item["main"]["temp"], 1),
        "humidity": item["main"]["humidity"],
        "description": item["weather"][0]["description"].title()
    } for item in data["list"][:8]]

    crud.save_forecast_cache(city, clean_forecast)
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
    # Mantivemos a sua excelente lógica de ETL com defaultdict e agrupamento!
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{FORECAST_URL}?q={city}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar previsão estendida")
        data = resp.json()

    daily_data = defaultdict(list)
    for item in data["list"]:
        date_str = item["dt_txt"][:10]  
        daily_data[date_str].append(item)

    extended_forecast = []
    for date_str, readings in daily_data.items():
        if len(extended_forecast) >= 5: 
            break
            
        temps = [r["main"]["temp"] for r in readings]
        midday_reading = next((r for r in readings if "12:00:00" in r["dt_txt"]), readings[0])
        
        ano, mes, dia = date_str.split("-")
        extended_forecast.append({
            "date": f"{dia}/{mes}",
            "temp_min": round(min(temps), 1),
            "temp_max": round(max(temps), 1),
            "description": midday_reading["weather"][0]["description"].title()
        })

    return {"city": city.title(), "extended_forecast": extended_forecast}

async def fetch_weather_by_coords(lat: float, lon: float):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{WEATHER_URL}?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&lang=pt_br")
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Erro ao buscar clima por coordenadas")
        data = resp.json()

    weather_data = {
        "city": data["name"].lower(),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "description": data["weather"][0]["description"],
        "timezone": data["timezone"]
    }

    crud.save_weather_cache(weather_data)
    weather_data["city"] = weather_data["city"].title()
    weather_data["source"] = "api_externa_gps"
    return weather_data