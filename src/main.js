        // === 1. Geração dos Cards das Cidades ===
        // Configuração de cores e cidades iniciais
        // === GERENCIAMENTO DE ESTADO (LOCALSTORAGE) ===
        function getCidades() {
            const salvas = localStorage.getItem('weatherDashCities');
            if (salvas) {
                return JSON.parse(salvas);
            }
            // Retorno padrão caso seja o primeiro acesso do usuário
            return ['recife', 'paulista', 'abreu e lima', 'olinda'];
        }

        function salvarCidades(cidades) {
            localStorage.setItem('weatherDashCities', JSON.stringify(cidades));
        }

        // === TYPEAHEAD & DEBOUNCE ===
        let debounceTimer;

        async function buscarSugestoes(query) {
            clearTimeout(debounceTimer); // Cancela o timer anterior se o usuário continuou digitando
            const box = document.getElementById('suggestionsBox');
            
            // Só busca se tiver pelo menos 3 letras
            if (query.trim().length < 3) { 
                box.classList.add('hidden'); 
                return; 
            }

            // Inicia um novo timer de 500ms
            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/search/${query}`);
                    const data = await res.json();
                    
                    box.innerHTML = '';
                    
                    if (data.length > 0) {
                        data.forEach(item => {
                            const li = document.createElement('li');
                            li.className = "px-6 py-3 cursor-pointer text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-cardBorder hover:text-neonCyan transition-colors border-b border-gray-100 dark:border-cardBorder last:border-0";
                            li.textContent = item.display;
                            
                            // Quando clica na sugestão:
                            li.onclick = () => {
                                document.getElementById('cityInput').value = item.name; // Joga o nome oficial pro input
                                box.classList.add('hidden'); // Esconde a caixa
                                adicionarCidade(); // Já aciona o botão de adicionar automaticamente!
                            };
                            box.appendChild(li);
                        });
                        box.classList.remove('hidden');
                    } else {
                        box.classList.add('hidden');
                    }
                } catch (error) {
                    console.error("Erro ao buscar sugestões", error);
                }
            }, 500); // Meio segundo de espera
        }

        // Esconder a caixa de sugestões se clicar fora dela
        document.addEventListener('click', (e) => {
            if (!document.getElementById('cityInput').contains(e.target)) {
                document.getElementById('suggestionsBox').classList.add('hidden');
            }
        });

        async function adicionarCidade() {
            const input = document.getElementById('cityInput');
            const novaCidade = input.value.trim().toLowerCase();
            
            if (!novaCidade) return;

            let cidades = getCidades();
            
            if (cidades.includes(novaCidade)) {
                alert("Esta cidade já está no seu painel.");
                return;
            }

            // Testa se o backend consegue achar a cidade antes de salvá-la na memória
            try {
                const res = await fetch(`/api/weather/${novaCidade}`);
                if (!res.ok) throw new Error();
                
                cidades.push(novaCidade);
                salvarCidades(cidades);
                input.value = ''; // Limpa o campo
                carregarDashboard(); // Recarrega a tela com a nova cidade
            } catch (error) {
                alert("Cidade não encontrada na base de dados. Verifique a ortografia.");
            }
        }

        

        function removerCidade(cidadeParaRemover) {
            let cidades = getCidades();
            cidades = cidades.filter(c => c !== cidadeParaRemover);
            salvarCidades(cidades);
            carregarDashboard(); // Recarrega a tela sem a cidade
        }
        const chartColors = ['#6D28D9', '#06B6D4', '#F59E0B', '#EF4444']; 
        let tempChartInstance = null;
        let humChartInstance = null;

        // === LÓGICA DO TEMA CLARO/ESCURO ===
        function toggleTheme() {
            const htmlEl = document.documentElement;
            const sunIcon = document.getElementById('themeIconSun');
            const moonIcon = document.getElementById('themeIconMoon');
            const logoImg = document.getElementById('logoImg');
            
            const isDark = htmlEl.classList.toggle('dark');
            
            // Alterna a exibição dos SVGs
            if (isDark) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
            
            // Troca a Logo (Lembre-se de ter a weather_logo_light.png na pasta)
            logoImg.src = isDark ? 'src/assets/weather_logo.png' : 'src/assets/weather_logo_light.png';

            // Atualiza as cores das grades do Chart.js
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

        // === FUNÇÃO DE INTEGRAÇÃO (ETL) ===
        async function carregarDashboard() {
            const container = document.getElementById('cityCardsContainer');
            container.innerHTML = '<p class="text-slate-500 dark:text-textMuted col-span-4 text-center">Buscando dados meteorológicos e processando ETL...</p>';

            try {
                const weatherDataList = [];
                const forecastDataList = [];

                for (const city of getCidades()) {
                    const weatherRes = await fetch(`/api/weather/${city}`);
                    if (!weatherRes.ok) throw new Error(`Erro ao buscar clima de ${city}`);
                    weatherDataList.push(await weatherRes.json());

                    const forecastRes = await fetch(`/api/forecast/${city}`);
                    if (!forecastRes.ok) throw new Error(`Erro ao buscar previsão de ${city}`);
                    forecastDataList.push(await forecastRes.json());
                }

                container.innerHTML = ''; 
                weatherDataList.forEach((cidade) => {
                    const card = document.createElement('div');
                    // Classes atualizadas para modo claro/escuro
                    // Classes com Hover Neon Turbinado
                    card.className = "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:-translate-y-1 hover:border-neonCyan hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 group";
                    card.innerHTML = `
                        <div>
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="text-slate-900 dark:text-white text-xl font-semibold">${cidade.city}</h3>
                                <!-- Botão de remover que chama a nova função -->
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
                        
                        <div class="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-textMuted border-t border-gray-100 dark:border-cardBorder pt-4 transition-colors">
                            <div class="flex flex-col gap-1">
                                <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Sensação</span>
                                <span class="text-slate-900 dark:text-white font-medium text-sm">${Math.round(cidade.feels_like)}°</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> Umidade</span>
                                <span class="text-slate-900 dark:text-white font-medium text-sm">${cidade.humidity}%</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Vento</span>
                                <span class="text-slate-900 dark:text-white font-medium text-sm">${cidade.wind_speed} m/s</span>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });

                const timeLabels = forecastDataList[0].forecast.map(f => f.time);
                const tempDatasets = forecastDataList.map((data, index) => ({
                    label: data.city,
                    data: data.forecast.map(f => f.temp),
                    borderColor: chartColors[index % chartColors.length],
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }));

                const humidityData = weatherDataList.map(w => w.humidity);
                const cityLabels = weatherDataList.map(w => w.city);

                renderCharts(timeLabels, tempDatasets, cityLabels, humidityData);
                await renderizarSecaoEstendida();

            } catch (error) {
                console.error(error);
                container.innerHTML = '<p class="text-neonRed col-span-4 text-center">Falha ao se conectar com o servidor. Verifique o console.</p>';
            }
        }

        function getCommonOptions() {
            const isDark = document.documentElement.classList.contains('dark');
            const gridColor = isDark ? '#232336' : '#e2e8f0';
            const textColor = isDark ? '#8B8A9D' : '#64748b';

            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, color: textColor } } },
                scales: {
                    x: { grid: { color: gridColor, drawBorder: false } },
                    y: { grid: { color: gridColor, drawBorder: false }, border: { dash: [4, 4] } }
                }
            };
        }

        // === HELPER: ÍCONES DINÂMICOS ===
        function getIconeClima(descricao) {
            const desc = descricao.toLowerCase();
            
            // Céu Limpo (Amarelo Neon) - Ícone de Sol
            if (desc.includes('limpo')) {
                return `<svg class="w-12 h-12 text-neonYellow mx-auto mb-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
            } 
            // Chuva, Chuvisco ou Tempestade (Ciano Neon) - Ícone de Nuvem com Chuva
            else if (desc.includes('chuva') || desc.includes('chuvisco') || desc.includes('tempestade')) {
                return `<svg class="w-12 h-12 text-neonCyan mx-auto mb-3 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14v2m-4-2v4m8-4v6M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
            } 
            // Neve (Branco) - Ícone de Floco de Neve
            else if (desc.includes('neve')) {
                return `<svg class="w-12 h-12 text-white mx-auto mb-3 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v18m0 0l-3-3m3 3l3-3m-9-6h18m0 0l-3-3m3 3l-3 3M6 9l12 6M6 15l12-6"></path></svg>`;
            } 
            // Geada, Frio (Roxo/Azulado Neon) - Termômetro Baixo
            else if (desc.includes('geada') || desc.includes('frio')) {
                return `<svg class="w-12 h-12 text-neonPurple mx-auto mb-3 drop-shadow-[0_0_8px_rgba(109,40,217,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v8l9-11h-7z"></path></svg>`;
            } 
            // Padrão: Nuvens ou Nublado (Cinza Escuro) - Ícone de Nuvem Simples
            else {
                return `<svg class="w-12 h-12 text-slate-400 dark:text-textMuted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
            }
        }

        // === HELPER: CÁLCULO DE FUSO HORÁRIO ===
        function getHoraLocalDaCidade(offsetSegundos) {
            const dataLocalUsuario = new Date();
            // Pega o horário atual do usuário em UTC puro (milissegundos)
            const utc = dataLocalUsuario.getTime() + (dataLocalUsuario.getTimezoneOffset() * 60000);
            
            // Adiciona o deslocamento da cidade (convertendo segundos para milissegundos)
            const dataCidade = new Date(utc + (offsetSegundos * 1000));
            
            // Retorna no formato HH:MM
            return dataCidade.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        // === LÓGICA DA PREVISÃO ESTENDIDA (TABS) ===
        let tabAtualSelecionada = null;

        async function renderizarSecaoEstendida() {
            const cidades = getCidades();
            if (cidades.length === 0) return;
            
            // Define a primeira cidade como padrão caso nenhuma esteja selecionada
            if (!tabAtualSelecionada || !cidades.includes(tabAtualSelecionada)) {
                tabAtualSelecionada = cidades[0];
            }

            // 1. Cria as Abas (Botões) Dinâmicas
            const tabsContainer = document.getElementById('forecastTabs');
            tabsContainer.innerHTML = '';
            
            cidades.forEach(cidade => {
                const isAtivo = cidade === tabAtualSelecionada;
                const btn = document.createElement('button');
                
                // O botão ativo ganha cor Neon, os inativos ficam sutis
                btn.className = isAtivo 
                    ? "bg-neonCyan text-black px-6 py-2 rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105 capitalize"
                    : "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder text-slate-600 dark:text-textMuted px-6 py-2 rounded-xl font-medium text-sm hover:text-neonCyan dark:hover:text-neonCyan transition-all capitalize";
                
                btn.textContent = cidade;
                
                // Ao clicar, muda a tab atual e recarrega a seção
                btn.onclick = () => {
                    tabAtualSelecionada = cidade;
                    renderizarSecaoEstendida(); 
                };
                
                tabsContainer.appendChild(btn);
            });

            // 2. Busca no Backend e Renderiza os 5 Cards
            const gridContainer = document.getElementById('extendedForecastGrid');
            gridContainer.innerHTML = '<p class="text-slate-500 dark:text-textMuted col-span-5 text-center py-8">Carregando previsão de 5 dias...</p>';

            try {
                const res = await fetch(`/api/extended-forecast/${tabAtualSelecionada}`);
                if (!res.ok) throw new Error("Falha na API");
                const data = await res.json();
                
                gridContainer.innerHTML = '';
                
                data.extended_forecast.forEach(dia => {
                    const icone = getIconeClima(dia.description);
                    const card = document.createElement('div');
                    card.className = "bg-white dark:bg-cardDark border border-gray-200 dark:border-cardBorder rounded-2xl p-5 text-center shadow-sm hover:-translate-y-1 transition-transform duration-300";
                    
                    card.innerHTML = `
                        <p class="text-slate-900 dark:text-white font-bold text-lg mb-4">${dia.date}</p>
                        ${icone}
                        <p class="text-xs font-medium text-slate-500 dark:text-textMuted capitalize h-8 flex items-center justify-center mb-4 leading-tight">${dia.description}</p>
                        <div class="flex justify-between items-center px-1 pt-3 border-t border-gray-100 dark:border-cardBorder">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-slate-400 dark:text-textMuted uppercase">Mín</span>
                                <span class="text-slate-500 dark:text-textMuted font-medium">${dia.temp_min}º</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-slate-400 dark:text-textMuted uppercase">Máx</span>
                                <span class="text-slate-900 dark:text-white font-bold">${dia.temp_max}º</span>
                            </div>
                        </div>
                    `;
                    gridContainer.appendChild(card);
                });
                
            } catch(e) {
                console.error(e);
                gridContainer.innerHTML = '<p class="text-neonRed col-span-5 text-center py-8">Não foi possível carregar a previsão estendida.</p>';
            }
        }

        function renderCharts(timeLabels, tempDatasets, cityLabels, humidityData) {
            if (tempChartInstance) tempChartInstance.destroy();
            if (humChartInstance) humChartInstance.destroy();

            const commonOptions = getCommonOptions();

            const ctxTemp = document.getElementById('tempChart').getContext('2d');
            tempChartInstance = new Chart(ctxTemp, {
                type: 'line',
                data: { labels: timeLabels, datasets: tempDatasets },
                options: commonOptions
            });

            const ctxHum = document.getElementById('humidityChart').getContext('2d');
            humChartInstance = new Chart(ctxHum, {
                type: 'bar',
                data: {
                    labels: cityLabels,
                    datasets: [{
                        data: humidityData,
                        backgroundColor: chartColors,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: { legend: { display: false } }, 
                    scales: {
                        x: { grid: { display: false } },
                        y: { max: 100, grid: { color: commonOptions.scales.y.grid.color, drawBorder: false }, border: { dash: [4, 4] } }
                    }
                }
            });
        }

        carregarDashboard();

        