/* O que há aqui:
Inicialização da página
Exposição de funções para os listeners nativos do DOM
*/

import { renderizarDashboard } from './render.js';
import { 
    buscarSugestoes, 
    adicionarCidade, 
    removerCidade, 
    toggleTheme, 
    exportarDadosCSV, 
    buscarLocalizacao 
} from './app.js';

// === PARA MANTER OS ONCLICKS DO HTML FUNCIONANDO ===
window.buscarSugestoes = buscarSugestoes;
window.adicionarCidade = adicionarCidade;
window.removerCidade = removerCidade;
window.toggleTheme = toggleTheme;
window.exportarDadosCSV = exportarDadosCSV;
window.buscarLocalizacao = buscarLocalizacao;

// Fechar caixa de sugestões se clicar fora
document.addEventListener('click', (e) => {
    const input = document.getElementById('cityInput');
    const box = document.getElementById('suggestionsBox');
    
    if (input && box && !input.contains(e.target)) {
        box.classList.add('hidden');
    }
});

// Dá a largada na aplicação quando o HTML termina de ler
document.addEventListener('DOMContentLoaded', () => {
    renderizarDashboard();
});