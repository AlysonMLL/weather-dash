/* O que há aqui:
getCidades()
salvarCidades()
*/

export function getCidades() {
    const salvas = localStorage.getItem('weatherDashCities');
    if (salvas) {
        return JSON.parse(salvas);
    }
    // Retorno padrão caso seja o primeiro acesso do usuário
    return ['recife', 'são paulo'];
    // 'paulista', 'abreu e lima', 'olinda'
}


export function salvarCidades(cidades) {
    localStorage.setItem('weatherDashCities', JSON.stringify(cidades));
}