from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from database import init_db
from services import fetch_weather_data, fetch_forecast_data, fetch_city_suggestions, fetch_extended_forecast, export_weather_data_to_zip, fetch_weather_by_coords


app = FastAPI()
app.mount("/src", StaticFiles(directory="src"), name="src")
app.mount("/public", StaticFiles(directory="public"), name="public")

# Inicializa o banco ao rodar o servidor
init_db()

@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/api/weather/{city}")
async def get_weather(city: str):
    return await fetch_weather_data(city)

@app.get("/api/forecast/{city}")
async def get_forecast(city: str):
    return await fetch_forecast_data(city)

@app.get("/api/search/{query}")
async def search_city(query: str):
    return await fetch_city_suggestions(query)

@app.get("/api/extended-forecast/{city}")
async def get_extended_forecast(city: str):
    return await fetch_extended_forecast(city)

@app.get("/api/export/csv")
async def export_data():
    return export_weather_data_to_zip()

@app.get("/api/weather/coords")
async def get_weather_by_coords(lat: float, lon: float):
    return await fetch_weather_by_coords(lat, lon)