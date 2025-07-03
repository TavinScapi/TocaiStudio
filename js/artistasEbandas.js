// ===================
// Variáveis Globais
// ===================
let allArtists = [];
let filteredArtists = [];
let currentPage = 1;
const artistsPerPage = 12;
let infoArtistas = {}; // Novo objeto para armazenar os detalhes

// ===================
// Carregar Dados JSON
// ===================

document.addEventListener('DOMContentLoaded', () => {
    fetch('../data/infoARTISTAS.json')
        .then(response => response.json())
        .then(data => {
            infoArtistas = data;
            allArtists = Object.keys(data).map(id => ({
                id,
                ...data[id]
            }));
            filteredArtists = [...allArtists];
            displayArtists(filteredArtists, currentPage);
            setupPagination(filteredArtists);
            renderGenreDropdown(getAllGenres(allArtists)); // <-- Chama aqui!
        })
        .catch(error => console.error('Erro ao carregar artistas:', error));
});

// Função para extrair todos os gêneros únicos dos artistas
function getAllGenres(artists) {
    const genresSet = new Set();
    artists.forEach(artist => {
        if (artist.genres) {
            artist.genres.split(/[•,]/).forEach(g => {
                const genre = g.trim().toLowerCase();
                if (genre) genresSet.add(genre);
            });
        }
    });
    return Array.from(genresSet).sort();
}

function renderGenreDropdown(genres) {
    const dropdown = document.getElementById("dropdown");
    dropdown.innerHTML = `<input type="text" id="searchGenre" placeholder="Digite o gênero musical..." onkeyup="filterGenres()">`;

    // Gêneros que já estão como botões fixos
    const fixedGenres = ['rock', 'pop', 'jazz', 'sertanejo', 'mpb'];

    genres
        .filter(genre => !fixedGenres.includes(genre.toLowerCase()))
        .forEach(genre => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerText = genre.charAt(0).toUpperCase() + genre.slice(1);
            item.onclick = () => selectGenre(genre);
            dropdown.appendChild(item);
        });
}


// ===================
// Filtros
// ===================
function filterByGenre(selectedGenre) {
    filteredArtists = (selectedGenre === 'todos')
        ? [...allArtists]
        : allArtists.filter(artist =>
            artist.genres.toLowerCase().includes(selectedGenre.toLowerCase())
        );

    currentPage = 1;
    displayArtists(filteredArtists, currentPage);
    setupPagination(filteredArtists);

    document.getElementById('searchInput').value = '';
}

function searchArtists() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (searchTerm === '') {
        displayArtists(filteredArtists, 1);
        setupPagination(filteredArtists);
        currentPage = 1;
        return;
    }

    const searchedArtists = filteredArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm) ||
        (artist.biography && artist.biography.toLowerCase().includes(searchTerm)) ||
        (artist.genres && artist.genres.toLowerCase().includes(searchTerm))
    );

    currentPage = 1;
    displayArtists(searchedArtists, currentPage);
    setupPagination(searchedArtists);
}

// ===================
// Exibir Artistas
// ===================
function displayArtists(artists, page) {
    const listaArtistas = document.querySelector('.lista-artistas');
    listaArtistas.innerHTML = '';

    const followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');

    // Ordenar: seguidos primeiro
    const sortedArtists = [...artists].sort((a, b) => {
        const aFollowed = followed.includes(a.id);
        const bFollowed = followed.includes(b.id);
        if (aFollowed && !bFollowed) return -1;
        if (!aFollowed && bFollowed) return 1;
        return 0;
    });

    const startIndex = (page - 1) * artistsPerPage;
    const endIndex = startIndex + artistsPerPage;
    const paginatedArtists = sortedArtists.slice(startIndex, endIndex);

    if (paginatedArtists.length === 0) {
        listaArtistas.innerHTML = '<p class="no-results">Nenhum artista encontrado.</p>';
        return;
    }

    paginatedArtists.forEach(artista => {
        const isFollowed = followed.includes(artista.id);

        const card = document.createElement('div');
        card.className = 'card-vinil';
        card.setAttribute('data-genre', artista.genres);
        card.onclick = () => selectArtist(artista.id);

        card.innerHTML = `
            <div class="record_case">
                <div class="genre-label">${artista.genres}</div>
                <div class="record recorddefault">
                    <div class="front">
                        <img src="${artista.capa}" alt="${artista.name}">
                        <div class="cover"></div>
                        <div class="cover-back"></div>
                    </div>
                    <div class="vinyl"></div>
                    <div class="back">
                        <img src="${artista.capa}" alt="${artista.name}">
                    </div>
                    <div class="right"></div>
                    <div class="left"></div>
                    <div class="top"></div>
                    <div class="bottom"></div>
                </div>
            </div>
            <h3>${artista.name} ${isFollowed ? '<span class="seguindo-icon" title="Seguindo"><i class="fas fa-check-circle" style="color: #2ecc71;"></i></span>' : ''}</h3>
            <p>${artista.biography ? artista.biography.split('.')[0] + '.' : ''}</p>
            <button class="button">Ver Mais</button>
        `;

        listaArtistas.appendChild(card);
    });
}

// ===================
// Paginação
// ===================
function setupPagination(artists) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const pageCount = Math.ceil(artists.length / artistsPerPage);
    if (pageCount <= 1) return;

    // Botão Anterior
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo;';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayArtists(artists, currentPage);
            updatePaginationButtons(artists);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    pagination.appendChild(prevButton);

    // Botões de Página
    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) pageButton.classList.add('active');

        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayArtists(artists, currentPage);
            updatePaginationButtons(artists);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        pagination.appendChild(pageButton);
    }

    // Botão Próximo
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&raquo;';
    nextButton.addEventListener('click', () => {
        if (currentPage < pageCount) {
            currentPage++;
            displayArtists(artists, currentPage);
            updatePaginationButtons(artists);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    pagination.appendChild(nextButton);

    updatePaginationButtons(artists);
}

function updatePaginationButtons(artists) {
    const pageCount = Math.ceil(artists.length / artistsPerPage);
    const buttons = document.querySelectorAll('.pagination button');

    buttons.forEach((button, index) => {
        button.classList.remove('active');

        if (index === 0) {
            button.disabled = currentPage === 1;
            button.classList.toggle('disabled', currentPage === 1);
        } else if (index === buttons.length - 1) {
            button.disabled = currentPage === pageCount;
            button.classList.toggle('disabled', currentPage === pageCount);
        } else if (index === currentPage) {
            button.classList.add('active');
        }
    });
}

// ===================
// Dropdown de Gêneros
// ===================
function toggleDropdown() {
    const dropdown = document.getElementById("dropdown");
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
}

function filterGenres() {
    const input = document.getElementById("searchGenre").value.toLowerCase();
    const items = document.getElementsByClassName("dropdown-item");

    for (let item of items) {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(input) ? "block" : "none";
    }
}

function selectGenre(value) {
    document.querySelector(".dropdown-button").innerText = value.charAt(0).toUpperCase() + value.slice(1);
    document.getElementById("dropdown").style.display = "none";
    filterByGenre(value);
}

// ===================
// Selecionar Artista
// ===================
function selectArtist(artistId) {
    // Mude para passar por URL em vez de localStorage
    window.location.href = `../pages/Artista.html?artist=${artistId}`;
}