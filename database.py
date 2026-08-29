import sqlite3

DB_NAME = "weather_cache.db"

def get_connection():
    """Retorna uma conexão com o banco de dados SQLite."""
    return sqlite3.connect(DB_NAME)

def init_db():
    """Inicializa as tabelas de cache se não existirem."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tabela de clima atual
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather (
            city TEXT PRIMARY KEY,
            temp REAL,
            feels_like REAL,
            humidity INTEGER,
            wind_speed REAL,
            description TEXT,
            timezone INTEGER, 
            updated_at DATETIME
        )
    """)
    
    # Tabela de previsões
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecast (
            city TEXT PRIMARY KEY,
            forecast_data TEXT,
            updated_at DATETIME
        )
    """)
    
    conn.commit()
    conn.close()