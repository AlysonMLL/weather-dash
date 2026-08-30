/* O que há aqui:
adicionarCidade()
removerCidade()
buscarSugestoes()
buscarLocalizacao()
toggleTheme()
exportarDadosCSV()
*/

import { getCidades, salvarCidades } from './storage.js';
import { fetchSugestoes, fetchClima, fetchClimaPorCoordenadas } from './api.js';
import { renderizarDashboard, updateChartsTheme } from './render.js';

let debounceTimer;

export async function buscarSugestoes(query) {
    clearTimeout(debounceTimer);
    const box = document.getElementById('suggestionsBox');
    
    if (query.trim().length < 3) { box.classList.add('hidden'); return; }

    debounceTimer = setTimeout(async () => {
        try {
            const data = await fetchSugestoes(query);
            box.innerHTML = '';
            
            if (data.length > 0) {
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.className = "px-6 py-3 cursor-pointer text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-cardBorder hover:text-neonCyan transition-colors border-b border-gray-100 dark:border-cardBorder last:border-0";
                    li.textContent = item.display;
                    
                    li.onclick = () => {
                        document.getElementById('cityInput').value = item.name;
                        box.classList.add('hidden');
                        adicionarCidade();
                    };
                    box.appendChild(li);
                });
                box.classList.remove('hidden');
            } else { box.classList.add('hidden'); }
        } catch (error) { console.error("Erro ao buscar sugestões", error); }
    }, 500);
}

export async function adicionarCidade() {
    const input = document.getElementById('cityInput');
    const novaCidade = input.value.trim().toLowerCase();
    
    if (!novaCidade) return;

    let cidades = getCidades();
    if (cidades.includes(novaCidade)) {
        alert("Esta cidade já está no seu painel.");
        return;
    }

    try {
        await fetchClima(novaCidade); // Testa pra ver se existe
        cidades.push(novaCidade);
        salvarCidades(cidades);
        input.value = '';
        renderizarDashboard();
    } catch (error) {
        alert("Cidade não encontrada na base de dados. Verifique a ortografia.");
    }
}

export function removerCidade(cidadeParaRemover) {
    let cidades = getCidades();
    cidades = cidades.filter(c => c !== cidadeParaRemover);
    salvarCidades(cidades);
    renderizarDashboard();
}

export function toggleTheme() {
    const htmlEl = document.documentElement;
    const sunIcon = document.getElementById('themeIconSun');
    const moonIcon = document.getElementById('themeIconMoon');
    const logoImg = document.getElementById('logoImg');
    
    const isDark = htmlEl.classList.toggle('dark');
    
    if (isDark) { sunIcon.classList.remove('hidden'); moonIcon.classList.add('hidden'); } 
    else { sunIcon.classList.add('hidden'); moonIcon.classList.remove('hidden'); }
    
    logoImg.src = isDark ? 'src/assets/weather_logo.png' : 'src/assets/weather_logo_light.png';
    updateChartsTheme(isDark);
}

export async function buscarLocalizacao() {
    if (!navigator.geolocation) { alert("O seu navegador não suporta geolocalização."); return; }

    const geoBtn = document.getElementById('geoBtn');
    geoBtn.classList.add('animate-pulse', 'text-neonCyan'); 

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const data = await fetchClimaPorCoordenadas(position.coords.latitude, position.coords.longitude);
                const cidadeDetectada = data.city.toLowerCase();
                let cidades = getCidades();
                
                if (!cidades.includes(cidadeDetectada)) {
                    cidades.push(cidadeDetectada);
                    salvarCidades(cidades);
                }
                
                document.getElementById('cityInput').value = '';
                geoBtn.classList.remove('animate-pulse', 'text-neonCyan');
                renderizarDashboard(); 
            } catch (error) {
                console.error("Erro no fluxo de GPS:", error);
                geoBtn.classList.remove('animate-pulse', 'text-neonCyan');
            }
        },
        (error) => {
            console.error("Erro de GPS:", error);
            geoBtn.classList.remove('animate-pulse', 'text-neonCyan');
        }
    );
}

export function exportarDadosCSV() {
    window.location.href = '/api/export/csv';
}