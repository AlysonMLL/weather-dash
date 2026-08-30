"""
O que há aqui:
- export_weather_data_to_zip()

Função do arquivo: Isolar a complexidade de criar planilhas CSV e compactá-las 
em arquivos ZIP diretamente na memória RAM (Zero I/O bottleneck).
"""

import io
import csv
import zipfile
from fastapi.responses import StreamingResponse

try:
    from backend import crud
except ModuleNotFoundError:  # fallback para execução direta
    import crud

def export_weather_data_to_zip():
    # 1. Pede os dados ao CRUD (não toca no SQL)
    rows = crud.get_all_weather_data()

    # 2. Cria o CSV na memória RAM
    csv_file = io.StringIO()
    writer = csv.writer(csv_file)
    writer.writerow(["Cidade", "Temperatura (C)", "Sensação (C)", "Umidade (%)", "Vento (m/s)", "Clima", "Última Atualização"])
    writer.writerows(rows)

    # 3. Cria o arquivo ZIP na memória RAM
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        zip_file.writestr("dados_climaticos_atualizados.csv", csv_file.getvalue())

    # 4. Retorna o ponteiro do buffer para o início
    zip_buffer.seek(0)
    
    # 5. Envia o arquivo por Streaming
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=exportacao_weatherdash.zip"}
    )