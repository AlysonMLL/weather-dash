/* O que há aqui:
renderizarDashboard() (antigo carregarDashboard)
renderizarSecaoEstendida()
renderCharts()
updateChartsTheme() (separado para o toggleTheme usar)
*/

import { getCidades } from './storage.js';
import { getIconeClima, getHoraLocalDaCidade } from './utils.js';
import { fetchClima, fetchPrevisao, fetchPrevisaoEstendida } from './api.js';

const chartColors = ['#6D28D9', '#06B6D4', '#F59E0B', '#EF4444']; 
let tempChartInstance = null;
let humChartInstance = null;
let tabAtualSelecionada = null;

export async function renderizarDashboard() {
    const container = document.getElementById('cityCardsContainer');
    container.innerHTML = '<p class="text-slate-500 dark:text-textMuted col-span-4 text-center">Buscando dados meteorológicos e processando ETL...</p>';

    try {
        const weatherDataList = [];
        const forecastDataList = [];

        for (const city of getCidades()) {
            weatherDataList.push(await fetchClima(city));
            forecastDataList.push(await fetchPrevisao(city));
        }

        container.innerHTML = ''; 
        weatherDataList.forEach((cidade) => {
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:-translate-y-1 hover:border-neonCyan hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 group";
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-slate-900 dark:text-white text-xl font-semibold">${cidade.city}</h3>
                        <button onclick="removerCidade('${cidade.city.toLowerCase()}')" class="text-slate-300 dark:text-textMuted hover:text-neonRed dark:hover:text-neonRed transition-colors" title="Remover do painel">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <p class="text-slate-500 dark:text-textMuted text-sm capitalize">${cidade.description}</p>
                </div>
                <div class="my-6 flex justify-between items-end">
                    <div>
                        <span class="text-slate-900 dark:text-white text-5xl font-bold">${Math.round(cidade.temp)}°</span><span class="text-slate-500 dark:text-textMuted text-xl ml-1">C</span>
                    </div>
                    <div class="text-right">
                        <span class="block text-slate-900 dark:text-white text-2xl font-bold mb-0.5">${getHoraLocalDaCidade(cidade.timezone)}</span>
                        <span class="text-[10px] text-slate-400 dark:text-textMuted uppercase font-bold tracking-wider">Hora Local</span>
                    </div>
                </div>
                <!-- ... o resto da renderização do card ... -->
            `;
            container.appendChild(card);
        });

        const timeLabels = forecastDataList[0].forecast.map(f => f.time);
        const tempDatasets = forecastDataList.map((data, index) => ({
            label: data.city,
            data: data.forecast.map(f => f.temp),
            borderColor: chartColors[index % chartColors.length],
            tension: 0.4, borderWidth: 2, pointRadius: 0
        }));

        const humidityData = weatherDataList.map(w => w.humidity);
        const cityLabels = weatherDataList.map(w => w.city);

        renderCharts(timeLabels, tempDatasets, cityLabels, humidityData);
        await renderizarSecaoEstendida();

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-neonRed col-span-4 text-center">Falha ao se conectar com o servidor.</p>';
    }
}

export async function renderizarSecaoEstendida() {
    const cidades = getCidades();
    if (cidades.length === 0) return;
    
    if (!tabAtualSelecionada || !cidades.includes(tabAtualSelecionada)) {
        tabAtualSelecionada = cidades[0];
    }

    const tabsContainer = document.getElementById('forecastTabs');
    tabsContainer.innerHTML = '';
    
    cidades.forEach(cidade => {
        const isAtivo = cidade === tabAtualSelecionada;
        const btn = document.createElement('button');
        btn.className = isAtivo 
            ? "bg-neonCyan text-black px-6 py-2 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105 capitalize"
            : "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder text-slate-600 dark:text-textMuted px-6 py-2 rounded-xl font-medium text-sm hover:text-neonCyan dark:hover:text-neonCyan transition-all capitalize";
        btn.textContent = cidade;
        btn.onclick = () => { tabAtualSelecionada = cidade; renderizarSecaoEstendida(); };
        tabsContainer.appendChild(btn);
    });

    const gridContainer = document.getElementById('extendedForecastGrid');
    gridContainer.innerHTML = '<p class="text-slate-500 dark:text-textMuted col-span-5 text-center py-8">Carregando previsão de 5 dias...</p>';

    try {
        const data = await fetchPrevisaoEstendida(tabAtualSelecionada);
        gridContainer.innerHTML = '';
        
        data.extended_forecast.forEach(dia => {
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder rounded-2xl p-5 text-center shadow-sm hover:-translate-y-1 transition-transform duration-300";
            card.innerHTML = `
                <p class="text-slate-900 dark:text-white font-bold text-lg mb-4">${dia.date}</p>
                ${getIconeClima(dia.description)}
                <p class="text-xs font-medium text-slate-500 dark:text-textMuted capitalize h-8 flex items-center justify-center mb-4 leading-tight">${dia.description}</p>
                <!-- ... mínimas e máximas ... -->
            `;
            gridContainer.appendChild(card);
        });
    } catch(e) {
        console.error(e);
        gridContainer.innerHTML = '<p class="text-neonRed col-span-5 text-center py-8">Não foi possível carregar a previsão estendida.</p>';
    }
}

function getCommonOptions() {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#232336' : '#e2e8f0';
    const textColor = isDark ? '#8B8A9D' : '#64748b';
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: textColor } } },
        scales: {
            x: { grid: { color: gridColor, drawBorder: false } },
            y: { grid: { color: gridColor, drawBorder: false }, border: { dash: [4, 4] } }
        }
    };
}

export function renderCharts(timeLabels, tempDatasets, cityLabels, humidityData) {
    if (tempChartInstance) tempChartInstance.destroy();
    if (humChartInstance) humChartInstance.destroy();

    const commonOptions = getCommonOptions();

    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    tempChartInstance = new Chart(ctxTemp, { type: 'line', data: { labels: timeLabels, datasets: tempDatasets }, options: commonOptions });

    const ctxHum = document.getElementById('humidityChart').getContext('2d');
    humChartInstance = new Chart(ctxHum, {
        type: 'bar',
        data: { labels: cityLabels, datasets: [{ data: humidityData, backgroundColor: chartColors, borderRadius: 4 }] },
        options: { ...commonOptions, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { max: 100, grid: { color: commonOptions.scales.y.grid.color, drawBorder: false }, border: { dash: [4, 4] } } } }
    });
}

// Criado para que o toggleTheme do app.js consiga atualizar as cores do gráfico
export function updateChartsTheme(isDark) {
    const gridColor = isDark ? '#232336' : '#e2e8f0';
    const textColor = isDark ? '#8B8A9D' : '#64748b';
    
    if (tempChartInstance && humChartInstance) {
        tempChartInstance.options.scales.x.grid.color = gridColor;
        tempChartInstance.options.scales.y.grid.color = gridColor;
        tempChartInstance.options.plugins.legend.labels.color = textColor;
        tempChartInstance.update();
        humChartInstance.options.scales.y.grid.color = gridColor;
        humChartInstance.update();
    }
}