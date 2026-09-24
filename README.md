<p align="center">
  <img class="allign-center" width="450" height="150" alt="weather_logo" src="https://github.com/user-attachments/assets/4ebc7ad7-f01a-455d-a13a-38ea08286c1d" />
</p>  

# 🌤️ WeatherDash | Dashboard Meteorológico & Micro-ETL

Um painel de monitoramento climático de alta performance construído com a arquitetura BFF (Backend For Frontend), focando em extração de dados inteligente, otimização de cache local e visualização de dados (Data Viz) responsiva.

Acesse o site em: [WeatherDash](https://weather-dash-kclj.onrender.com/) (talvez seja necessário aguardar o Render carregar a página)

<br>

<p align="center">

<img width="70" height="70" alt="vs-code-svgrepo-com" src="https://github.com/user-attachments/assets/d7906bee-7540-4bff-935d-ef3ea886e5be" />

<img width="70" height="70" alt="python-svgrepo" src="https://github.com/user-attachments/assets/2439d9a9-a6b7-49ea-bec0-4aeb9eb0608b" />

<img width="70" height="70" alt="javascript-svgrepo-com" src="https://github.com/user-attachments/assets/f02fd815-05f8-4b40-b76f-1c5cff272f4e" />

<img width="60" height="70" alt="chart-js-seeklogo" src="https://github.com/user-attachments/assets/e5a9f519-a7e6-43e4-8fbc-954fd61382ce" />

<img width="70" height="70" alt="html-5-svgrepo-com" src="https://github.com/user-attachments/assets/61350760-93f0-4240-9cb6-f9e79d04774c" />

<img width="70" height="70" alt="css-3-svgrepo-com" src="https://github.com/user-attachments/assets/eca10606-61ea-40db-965f-991563f41871" />

<img width="230" height="70" alt="tailwindcss2-svgrepo" src="https://github.com/user-attachments/assets/222bb634-a695-4dcd-8990-f3675147d795" />

</p>


<p align="center">

<img width="310" height="70" alt="FastAPI_logo" src="https://github.com/user-attachments/assets/2b96f7fc-ca27-4f2c-9583-7d86c4d85d86" />

<img width="240" height="70" alt="render" src="https://github.com/user-attachments/assets/f6a1e874-971f-4428-857b-83fa7edf56a1" />

<img width="150" height="70" alt="SQLite_zonalogo" src="https://github.com/user-attachments/assets/685da8be-9c8a-44e8-a7a5-1d670327f803" />

</p>

<br>

<img width="1000" height="500" alt="weathergif1" src="https://github.com/user-attachments/assets/e67dbcdc-7539-4cd7-ac1c-a6108ccb88b6" />

---

Este projeto não é apenas uma interface que consome uma API pública. Ele atua como um verdadeiro Micro-Pipeline ETL, orquestrando chamadas assíncronas, transformando respostas JSON complexas (cálculos de mínima, máxima e tendências climáticas) e carregando os resultados em um banco de dados relacional para servir como um cache inteligente e de baixíssima latência.

<img width="1000" height="500" alt="weathergif2" src="https://github.com/user-attachments/assets/41d0111a-bd99-4e7b-afa3-78a0ab9b6ea0" />

---

A interface foi projetada com foco absoluto em UX (User Experience), contando com um elegante design Bento Box, animações fluidas e suporte dinâmico a Dark Mode e Light Mode, que altera não apenas o CSS, mas nativamente as renderizações SVG e os gráficos do painel.

<img width="1000" height="500" alt="weathergif4" src="https://github.com/user-attachments/assets/9475c39c-3923-4256-9442-25fa74be7766" />

<br>

---

<img width="1000" height="500" alt="weathergif3" src="https://github.com/user-attachments/assets/89720711-23d9-4311-9b8f-8d0491f15f99" />

---

<br>

# 🎯 Principais Funcionalidades

* **Micro-ETL e Cache Inteligente (BFF):** O backend consome a OpenWeatherMap API, padroniza os dados e realiza o Upsert no SQLite. Chamadas subsequentes são servidas do cache local (TTL de 15 a 30 minutos), mitigando gargalos de I/O e protegendo a cota da API externa.

* **Extração e Exportação de Dados (.CSV / .ZIP):** Rota dedicada para geração de planilhas CSV e compactação em arquivo ZIP construída puramente em memória RAM (io.BytesIO e io.StringIO), garantindo processamento em streaming sem overhead de disco.

* **Geolocalização Nativa (HTML5):** Integração com o GPS do dispositivo do usuário para captura de coordenadas geográficas e detecção instantânea da cidade local.

* **Mecanismo de Busca com Debounce:** A barra de pesquisa protege o backend implementando um timer de 500ms antes de disparar a requisição de Geocoding, evitando spam de chamadas durante a digitação.

* **Persistência de Estado (Client-Side):** Utilização do LocalStorage do navegador para manter o agrupamento de cidades escolhidas pelo usuário, sem a necessidade de banco de dados extra ou autenticação.

* **Cálculo Nativo de Fuso Horário:** Conversão complexa de fusos horários em tempo real utilizando matemática de deslocamento UTC em JavaScript Puro, dispensando bibliotecas pesadas como Moment.js.

<br>

# 🏗️ Arquitetura e Modularização (Clean Architecture)

Para garantir a escalabilidade e manutenção, o projeto aplica os princípios de Separation of Concerns (Separação de Responsabilidades):

* **Backend (Python/FastAPI):** Dividido rigorosamente em 5 camadas lógicas: Rotas (main.py), Regras de Negócio e Serviços Externos (services.py), Camada de Acesso a Dados (crud.py e database.py) e Utilitários de Memória (export.py).

* **Frontend (Vanilla JS):** Código JavaScript segmentado utilizando ES Modules, separando a lógica de requisição (api.js), armazenamento (storage.js), manipulação da DOM/UI (render.js) e controladores (app.js).

<br>

# 🚀 Deploy e Infraestrutura

O projeto está em produção e pode ser acessado de qualquer lugar. A infraestrutura foi configurada pensando em automação, segurança e resiliência:

* **Hospedagem (Render):** Deploy realizado como um *Web Service* na nuvem do Render, garantindo alta performance para a aplicação construída em FastAPI
  
* **Continuous Deployment (CD):** Integração contínua e automática com o GitHub. A cada novo *commit* (`git push`) na branch principal, o Render realiza o *build* silencioso da nova versão, aplicando a atualização com *Zero Downtime* (sem o site sair do ar).
  
* **Estratégia de Cache Efêmero:** O ambiente em nuvem casa perfeitamente com a lógica do nosso micro-pipeline. Como o plano gratuito do Render realiza a hibernação da instância por inatividade, o banco de dados SQLite é intencionalmente zerado a cada novo ciclo. Isso força o sistema a acordar "limpo", garantindo que os dados em cache nunca fiquem obsoletos e atestando a resiliência do sistema de *Upsert*.
  
* **Segurança Cloud-Native:** Seguindo as melhores práticas adotadas no ambiente de desenvolvimento local com o uso da biblioteca `python-dotenv`[cite: 6], a chave da OpenWeatherMap API não é exposta no repositório. Ela é injetada de forma segura diretamente através do painel de *Environment Variables* da hospedagem.

<br>

# 🛠️ Tecnologias Utilizadas

### **Engenharia de Dados & Backend:**

* **Python:** Lógica de orquestração e ETL.

* **FastAPI & Uvicorn:** Framework assíncrono de altíssima performance para a construção do microsserviço.

* **SQLite3:** Banco de dados relacional leve atuando como camada de Cache.

* **Httpx:** Cliente HTTP assíncrono para consumo de APIs de terceiros.

* **Python-dotenv:** Gerenciamento seguro de credenciais e variáveis de ambiente.

### **Interface & UX:**

* **HTML5 Semântico & JavaScript (ES6+)**: Estruturação nativa e lógica client-side.

* **Tailwind CSS (CDN):** Estilização utilitária avançada e Grid Masonry para layout dinâmico.

* **Chart.js:** Visualização profissional de dados (Gráficos de Linha suavizada e Barras).

<br>

# 🗄️ Estrutura do Banco de Dados (Cache)

O sistema relacional garante a integridade dos dados meteorológicos através de chaves primárias e atualizações inteligentes:

* **Tabela weather:** Armazena as condições meteorológicas em tempo real de cada localidade (temperatura, umidade, vento, timezone) e o timestamp da última requisição.

* **Tabela forecast:** Guarda o bloco de dados estruturados (JSON) com as projeções futuras das cidades em saltos de horas para alimentação dos gráficos.

<br>

---

<br>

<p align="center">
  <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
  <img src="https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white" />
  <img src="https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white" />
  <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" />
</p>



