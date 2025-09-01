let artistsData = {};

document.addEventListener('DOMContentLoaded', function () {
    // Carrega o JSON dos artistas antes de tudo
    fetch('/data/infoARTISTAS.json')
        .then(response => {
            if (!response.ok) throw new Error('JSON de artistas não encontrado');
            return response.json();
        })
        .then(data => {
            artistsData = data;
            iniciarApp();
        })
        .catch(error => console.error('Erro ao carregar infoARTISTAS.json:', error));
});

function iniciarApp() {
    fetch('/components/sidebar.html')
        .then(response => {
            if (!response.ok) throw new Error('Sidebar não encontrada');
            return response.text();
        })
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data);
            setupSidebar();
        })
        .catch(error => console.error('Erro ao carregar sidebar:', error));

    // Carrega o footer dentro do home-section
    const homeSection = document.querySelector('.home-section');
    if (homeSection) {
        fetch('/components/footer.html')
            .then(response => {
                if (!response.ok) throw new Error('Footer não encontrado');
                return response.text();
            })
            .then(data => {
                homeSection.insertAdjacentHTML('beforeend', data);
            })
            .catch(error => console.error('Erro ao carregar footer:', error));
    }

    // Carrega o menu mobile apenas se NÃO estiver na rota /musica/:artist/:song
    if (!/^\/musica\/[^\/]+\/[^\/]+$/.test(window.location.pathname)) {
        fetch('/components/mobile-menu.html')
            .then(response => {
                if (!response.ok) throw new Error('Menu mobile não encontrado');
                return response.text();
            })
            .then(data => {
                document.body.insertAdjacentHTML('beforeend', data);
                setupMobileMenu();
            })
            .catch(error => console.error('Erro ao carregar menu mobile:', error));
    }

    // Só carrega menu-musica.html se estiver na rota /musica/:artist/:song
    if (/^\/musica\/[^\/]+\/[^\/]+$/.test(window.location.pathname)) {
        fetch('/components/menu-musica.html')
            .then(response => {
                if (!response.ok) throw new Error('Menu música não encontrado');
                return response.text();
            })
            .then(data => {
                document.body.insertAdjacentHTML('beforeend', data);
                setupMobileMenu();
                // Adicione aqui o script do auto scroll
                iniciarAutoScroll();
            })
            .catch(error => console.error('Erro ao carregar menu musica:', error));
    }

    function iniciarAutoScroll() {
        let autoScrollActive = false;
        const toggleBtn = document.getElementById('auto-scroll-toggle');
        const icon = document.getElementById('auto-scroll-icon');
        const speedInput = document.getElementById('auto-scroll-speed');
        const plusBtn = document.querySelector('#nav-expand-list-scroll .ri-add-line');
        const minusBtn = document.querySelector('#nav-expand-list-scroll .ri-subtract-line');
        let scrollInterval;

        // Impede que o menu feche ao clicar nos controles
        const scrollList = document.getElementById('nav-expand-list-scroll');
        if (scrollList) {
            scrollList.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }

        function startAutoScroll() {
            const speed = 11 - parseInt(speedInput.value);
            scrollInterval = setInterval(() => {
                window.scrollBy(0, 2);
            }, speed * 10);
        }

        function stopAutoScroll() {
            clearInterval(scrollInterval);
        }

        if (toggleBtn && icon && speedInput) {
            toggleBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                autoScrollActive = !autoScrollActive;
                if (autoScrollActive) {
                    icon.classList.remove('ri-play-line');
                    icon.classList.add('ri-stop-line');
                    startAutoScroll();
                } else {
                    icon.classList.remove('ri-stop-line');
                    icon.classList.add('ri-play-line');
                    stopAutoScroll();
                }
            });

            speedInput.addEventListener('input', function (e) {
                e.stopPropagation();
                if (autoScrollActive) {
                    stopAutoScroll();
                    startAutoScroll();
                }
            });

            // Botão de aumentar velocidade
            if (plusBtn) {
                plusBtn.parentElement.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let val = parseInt(speedInput.value);
                    if (val < 10) {
                        speedInput.value = val + 1;
                        speedInput.dispatchEvent(new Event('input'));
                    }
                });
            }

            // Botão de diminuir velocidade
            if (minusBtn) {
                minusBtn.parentElement.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let val = parseInt(speedInput.value);
                    if (val > 1) {
                        speedInput.value = val - 1;
                        speedInput.dispatchEvent(new Event('input'));
                    }
                });
            }
        }
    }

    // =============== CONFIGURAÇÃO DA SIDEBAR ===============
    function setupSidebar() {
        const sidebar = document.querySelector(".sidebar");
        const closeBtn = document.querySelector("#btn");
        const searchBtn = document.querySelector(".bx-search");
        const searchInput = document.querySelector(".nav-list input[type='text']");

        if (sidebar && closeBtn && searchBtn && searchInput) {
            // Evento do botão de menu (abrir/fechar sidebar)
            closeBtn.addEventListener("click", () => {
                sidebar.classList.toggle("open");
                menuBtnChange();
            });

            // Evento do ícone de pesquisa (abre sidebar + foca no input)
            searchBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!sidebar.classList.contains("open")) {
                    sidebar.classList.add("open");
                    menuBtnChange();
                }
                searchInput.focus();
            });

            // Altera o ícone do botão de menu
            function menuBtnChange() {
                if (sidebar.classList.contains("open")) {
                    closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
                } else {
                    closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
                }
            }

            // Configura a funcionalidade de pesquisa
            setupSearch();
        }
    }

    // =============== CONFIGURAÇÃO DO MENU MOBILE ===============
    function setupMobileMenu() {
        document.querySelectorAll('.nav__expand').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const expandList = btn.nextElementSibling;
                const expandIcon = btn.querySelector('.nav__expand-icon');

                if (expandList && expandList.classList.contains('nav__expand-list')) {
                    expandList.classList.toggle('show-list');
                }

                // Alterna ícones conforme o botão
                if (expandIcon) {
                    // Botão de rolagem: NÃO altera o ícone
                    if (expandIcon.classList.contains('ri-scroll-to-bottom-line')) {
                        // Não faz nada, mantém o ícone igual
                    }
                    // Botão de livro
                    else if (expandIcon.classList.contains('ri-book-line') || expandIcon.classList.contains('ri-book-open-line')) {
                        expandIcon.classList.toggle('ri-book-line');
                        expandIcon.classList.toggle('ri-book-open-line');
                    }
                    // Botão de +/- tom
                    else if (expandIcon.classList.contains('ri-menu-line') || expandIcon.classList.contains('ri-menu-add-line')) {
                        expandIcon.classList.toggle('ri-menu-line');
                        expandIcon.classList.toggle('ri-menu-add-line');
                    }
                }
            });
        });

        // Variável para controlar o estado do autoscroll
        let autoScrollActive = false;
        const autoScrollToggle = document.getElementById('auto-scroll-toggle');
        if (autoScrollToggle) {
            autoScrollToggle.addEventListener('click', function () {
                autoScrollActive = !autoScrollActive;
            });
        }

        // Fecha qualquer menu expandido ao clicar fora
        document.addEventListener('click', function (e) {
            // Só fecha se o autoscroll NÃO estiver ativo
            if (!autoScrollActive) {
                document.querySelectorAll('.nav__expand-list.show-list').forEach(list => {
                    list.classList.remove('show-list');
                    // Opcional: volta o ícone ao estado inicial
                    const btn = list.previousElementSibling;
                    if (btn) {
                        const icon = btn.querySelector('.nav__expand-icon');
                        if (icon) {
                            icon.classList.remove('ri-book-open-line', 'ri-menu-add-line', 'ri-scroll-to-top-line');
                            icon.classList.add('ri-book-line', 'ri-menu-line', 'ri-scroll-to-bottom-line');
                        }
                    }
                });
            }
        });

        // =============== ATIVAÇÃO DE LINKS POR PÁGINA ===============
        const navLinks = document.querySelectorAll('.nav__list a');
        const currentPage = window.location.pathname.split('/').pop();

        navLinks.forEach(link => link.classList.remove('active-link'));

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return; // <-- Adicione esta linha para evitar erro!
            const linkPage = href.split('/').pop();
            if (linkPage === currentPage ||
                (currentPage === 'index.html' && linkPage === 'home.html') ||
                (currentPage === 'home.html' && linkPage === 'index.html')) {
                link.classList.add('active-link');
            }
        });

        // =============== ESCONDER/MOSTRAR MENU NO SCROLL ===============
        const mobileMenu = document.querySelector('.nav');
        let lastScrollPosition = 0;
        const scrollThreshold = 10;

        if (mobileMenu) {
            mobileMenu.style.position = 'fixed';
            mobileMenu.style.zIndex = '1000';
            mobileMenu.style.transition = 'transform 0.3s ease';

            window.addEventListener('scroll', function () {
                const currentScrollPosition = window.scrollY;
                if (currentScrollPosition > lastScrollPosition && currentScrollPosition > scrollThreshold) {
                    mobileMenu.style.transform = 'translateY(150%)';
                } else if (currentScrollPosition < lastScrollPosition) {
                    mobileMenu.style.transform = 'translateY(0)';
                }
                lastScrollPosition = currentScrollPosition;
            });
        }
    }

    // =============== CONFIGURAÇÃO DA PESQUISA ===============
    function setupSearch() {
        const searchInput = document.getElementById('sidebar-search-input');

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const query = this.value;
                if (query.length > 2) { // Só pesquisa com pelo menos 3 caracteres
                    const results = searchSongs(query);
                    displaySearchResults(results);
                } else {
                    // Remove os resultados se a query for muito curta
                    const existingContainer = document.getElementById('search-results-container');
                    if (existingContainer) {
                        existingContainer.remove();
                    }
                }
            });

            // Fecha os resultados ao clicar fora
            document.addEventListener('click', function (e) {
                if (!e.target.closest('#search-results-container')) {
                    const existingContainer = document.getElementById('search-results-container');
                    if (existingContainer && e.target !== searchInput) {
                        existingContainer.remove();
                    }
                }
            });
        }
    }

    function searchSongs(query) {
        // Normaliza a query: remove acentos e coloca em minúsculas
        const normalize = (str) => {
            return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        };

        query = normalize(query.trim());
        if (!query) return []; // Retorna vazio se a query estiver vazia

        const results = [];

        // Percorre todos os artistas
        for (const artistKey in artistsData) {
            const artist = artistsData[artistKey];

            // Verifica se o nome do artista corresponde à busca
            const artistMatch = normalize(artist.name).includes(query);

            // Busca músicas que correspondem à busca
            const matchingSongs = (artist.popularTracks || []).filter(song =>
                normalize(song.name).includes(query)
            );

            // Se encontrou músicas ou o nome do artista bate, adiciona ao resultado
            if (artistMatch || matchingSongs.length > 0) {
                results.push({
                    artist: artist.name,
                    artistKey: artistKey,
                    songs: artistMatch && matchingSongs.length === 0
                        ? (artist.popularTracks || []) // Se só bateu o artista, mostra todas as músicas
                        : matchingSongs
                });
            }
        }

        return results;
    }

    function displaySearchResults(results) {
        const searchResultsContainer = document.createElement('div');
        searchResultsContainer.id = 'search-results-container';

        // Estilo Spotify
        searchResultsContainer.style.position = 'fixed';
        searchResultsContainer.style.top = '70px';
        searchResultsContainer.style.left = '280px';
        searchResultsContainer.style.backgroundColor = '#181818';  // Fundo escuro do Spotify
        searchResultsContainer.style.color = '#ffffff';
        searchResultsContainer.style.zIndex = '1000';
        searchResultsContainer.style.borderRadius = '8px';
        searchResultsContainer.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        searchResultsContainer.style.maxHeight = '500px';
        searchResultsContainer.style.overflowY = 'auto';
        searchResultsContainer.style.width = '350px';
        searchResultsContainer.style.padding = '0';
        searchResultsContainer.style.fontFamily = "'Circular', 'Helvetica Neue', sans-serif";
        searchResultsContainer.style.border = '1px solid #282828';

        // Estilização do scroll (moderno/dark)
        searchResultsContainer.style.scrollbarWidth = 'thin'; // Firefox
        searchResultsContainer.style.scrollbarColor = '#1db954 #181818'; // Firefox

        // Adiciona CSS para Webkit (Chrome, Edge, Safari)
        const style = document.createElement('style');
        style.innerHTML = `
        #search-results-container::-webkit-scrollbar {
            width: 8px;
        }
        #search-results-container::-webkit-scrollbar-thumb {
            background: #1db954;
            border-radius: 8px;
        }
        #search-results-container::-webkit-scrollbar-track {
            background: #181818;
        }
    `;
        document.head.appendChild(style);

        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
            <div style="
                padding: 20px;
                text-align: center;
                color: #b3b3b3;
                font-size: 14px;
            ">
                Nenhuma música encontrada
            </div>
        `;
        } else {
            let html = '';
            results.forEach(result => {
                html += `
                <div class="artist-result" style="
                    padding: 12px 16px;
                    border-bottom: 1px solid #282828;
                ">
                    <h4 style="
                        margin: 0 0 8px 0;
                        color: #1db954;
                        font-size: 14px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    ">${result.artist}</h4>
                    <ul style="
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    ">`;

                result.songs.forEach(song => {
                    html += `
                    <li class="song-result" 
                         data-artist="${result.artistKey}" 
                         data-song="${song.name}"
                         style="
                            padding: 10px 16px;
                            margin: 2px 0;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            font-size: 14px;
                            font-weight: 500;
                         "
                         onmouseover="this.style.backgroundColor='#282828'"
                         onmouseout="this.style.backgroundColor='transparent'"
                    >
                        <div style="
                            background-color: #535353;
                            width: 24px;
                            height: 24px;
                            border-radius: 2px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 12px;
                        ">
                            <i class='bx bx-music' style="color: #b3b3b3; font-size: 12px;"></i>
                        </div>
                        <span>${song.name}</span>
                    </li>`;
                });

                html += `</ul></div>`;
            });
            searchResultsContainer.innerHTML = html;
        }

        // Remove o container anterior se existir
        const existingContainer = document.getElementById('search-results-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        document.body.appendChild(searchResultsContainer);

        document.querySelectorAll('.song-result').forEach(item => {
            item.addEventListener('click', function () {
                const artistKey = this.getAttribute('data-artist');
                const songName = this.getAttribute('data-song');

                const encodedSong = encodeURIComponent(songName);
                window.location.href = `/musica/${artistKey}/${encodedSong}`;
            });
        });

    }
}