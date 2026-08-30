/* O que há aqui:
getIconeClima()
getHoraLocalDaCidade()
*/

export function getIconeClima(descricao) {
    const desc = descricao.toLowerCase();
    
    if (desc.includes('limpo')) {
        return `<svg class="w-12 h-12 text-neonYellow mx-auto mb-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
    } 
    else if (desc.includes('chuva') || desc.includes('chuvisco') || desc.includes('tempestade')) {
        return `<svg class="w-12 h-12 text-neonCyan mx-auto mb-3 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 14v2m-4-2v4m8-4v6M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
    } 
    else if (desc.includes('neve')) {
        return `<svg class="w-12 h-12 text-white mx-auto mb-3 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v18m0 0l-3-3m3 3l3-3m-9-6h18m0 0l-3-3m3 3l-3 3M6 9l12 6M6 15l12-6"></path></svg>`;
    } 
    else if (desc.includes('geada') || desc.includes('frio')) {
        return `<svg class="w-12 h-12 text-neonPurple mx-auto mb-3 drop-shadow-[0_0_8px_rgba(109,40,217,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v8l9-11h-7z"></path></svg>`;
    } 
    else {
        return `<svg class="w-12 h-12 text-slate-400 dark:text-textMuted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
    }
}

export function getHoraLocalDaCidade(offsetSegundos) {
    const dataLocalUsuario = new Date();
    const utc = dataLocalUsuario.getTime() + (dataLocalUsuario.getTimezoneOffset() * 60000);
    const dataCidade = new Date(utc + (offsetSegundos * 1000));
    return dataCidade.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}