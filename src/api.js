/* O que há aqui:
fetch para: clima atual, previsão, previsão estendida, geocoding, geolocalização.
*/

export async function fetchSugestoes(query) {
    const res = await fetch(`/api/search/${query}`);
    if (!res.ok) throw new Error("Erro ao buscar sugestões");
    return await res.json();
}

export async function fetchClima(cidade) {
    const res = await fetch(`/api/weather/${cidade}`);
    if (!res.ok) throw new Error("Cidade não encontrada");
    return await res.json();
}

export async function fetchPrevisao(cidade) {
    const res = await fetch(`/api/forecast/${cidade}`);
    if (!res.ok) throw new Error("Erro na previsão");
    return await res.json();
}

export async function fetchPrevisaoEstendida(cidade) {
    const res = await fetch(`/api/extended-forecast/${cidade}`);
    if (!res.ok) throw new Error("Falha na API");
    return await res.json();
}

export async function fetchClimaPorCoordenadas(lat, lon) {
    const res = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Falha na comunicação com o servidor.");
    return await res.json();
}