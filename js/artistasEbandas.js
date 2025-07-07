// ===================
// Variáveis Globais
// ===================
let allArtists = [];
let filteredArtists = [];
let currentPage = 1;
const artistsPerPage = 12;
let infoArtistas = {}; // Armazena os detalhes dos artistas

// ===================
// Carregamento Inicial
// ===================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../data/infoARTISTAS.json');
        const data = await response.json();

        infoArtistas = data;
        allArtists = Object.entries(data).map(([id, details]) => ({ id, ...details }));
        filteredArtists = [...allArtists];

        displayArtists(filteredArtists, currentPage);
        setupPagination(filteredArtists);
        renderGenreDropdown(getAllGenres(allArtists));
        enhancedSearch();
    } catch (error) {
        console.error('Erro ao carregar artistas:', error);
    }
});

// ===================
// Utilitários
// ===================
function normalizeString(str) {
    return str ? str.normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase() : "";
}

function getAllGenres(artists) {
    const genresSet = new Set();
    artists.forEach(artist => {
        artist.genres?.split(/[\u2022,]/).forEach(genre => {
            genre = genre.trim().toLowerCase();
            if (genre) genresSet.add(genre);
        });
    });
    return Array.from(genresSet).sort();
}

// ===================
// Dropdown de Gêneros
// ===================
function renderGenreDropdown(genres) {
    const dropdown = document.getElementById("dropdown");
    dropdown.innerHTML = `<input type="text" id="searchGenre" placeholder="Digite o gênero musical..." onkeyup="filterGenres()">`;

    const fixedGenres = ['rock', 'pop', 'jazz', 'sertanejo', 'mpb'];

    genres
        .filter(genre => !fixedGenres.includes(genre))
        .forEach(genre => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerText = genre.charAt(0).toUpperCase() + genre.slice(1);
            item.onclick = () => selectGenre(genre);
            dropdown.appendChild(item);
        });
}

function toggleDropdown() {
    const dropdown = document.getElementById("dropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function filterGenres() {
    const input = document.getElementById("searchGenre").value.toLowerCase();
    const items = document.getElementsByClassName("dropdown-item");

    for (let item of items) {
        item.style.display = item.innerText.toLowerCase().includes(input) ? "block" : "none";
    }
}

function selectGenre(value) {
    document.querySelector(".dropdown-button").innerText = value.charAt(0).toUpperCase() + value.slice(1);
    document.getElementById("dropdown").style.display = "none";
    filterByGenre(value);
}

// ===================
// Filtros e Busca
// ===================
function filterByGenre(selectedGenre) {
    const fixedGenres = ['todos', 'rock', 'pop', 'jazz', 'sertanejo', 'mpb'];
    if (fixedGenres.includes(selectedGenre.toLowerCase())) {
        document.querySelector(".dropdown-button").innerText = "Mais";
    }

    filteredArtists = selectedGenre === 'todos'
        ? [...allArtists]
        : allArtists.filter(artist => artist.genres.toLowerCase().includes(selectedGenre.toLowerCase()));

    currentPage = 1;
    displayArtists(filteredArtists, currentPage);
    setupPagination(filteredArtists);
    document.getElementById('searchInput').value = '';
    document.getElementById('pagination').style.display = 'block';
}

function searchArtists() {
    const searchTerm = normalizeString(document.getElementById('searchInput').value.trim());

    if (searchTerm === '') {
        displayArtists(filteredArtists, 1);
        setupPagination(filteredArtists);
        currentPage = 1;
        document.getElementById('pagination').style.display = 'block';
        return;
    }

    const matchedCards = [];
    const followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');

    for (const [artistKey, artist] of Object.entries(infoArtistas)) {
        const artistName = normalizeString(artist.name);
        const genres = normalizeString(artist.genres || '');
        const biography = normalizeString(artist.biography || '');
        const isFollowed = followed.includes(artistKey);
        const musicMatch = (artist.popularTracks || []).find(song => normalizeString(song.name).includes(searchTerm));

        if (artistName.includes(searchTerm) || genres.includes(searchTerm) || biography.includes(searchTerm) || musicMatch) {
            const card = document.createElement('div');
            card.className = 'card-vinil';
            card.setAttribute('data-genre', artist.genres);
            card.onclick = () => { if (!musicMatch) selectArtist(artistKey); };

            card.innerHTML = `
    <div class="record_case">
        <div class="genre-label">${artist.genres}</div>
        <div class="record recorddefault">
            <div class="front">
                <img src="${artist.capa}" alt="${artist.name}">
                <div class="cover"></div>
                <div class="cover-back"></div>
            </div>
            <div class="vinyl"></div>
            <div class="back">
                <img src="${artist.capa}" alt="${artist.name}">
            </div>
            <div class="right"></div>
            <div class="left"></div>
            <div class="top"></div>
            <div class="bottom"></div>
        </div>
    </div>
    <h3>${artist.name} ${isFollowed ? '<span class="seguindo-icon" title="Seguindo"><i class="fas fa-check-circle" style="color: #2ecc71;"></i></span>' : ''}</h3>
    ${musicMatch
                    ? `<button class="button" onclick="event.stopPropagation(); window.location.href='/musica/${artistKey}/${encodeURIComponent(musicMatch.name)}'">🎵 ${musicMatch.name}</button>`
                    : `<p class="music-count">Músicas disponíveis: ${artist.popularTracks ? artist.popularTracks.length : 0}</p>`
                }
`;

            matchedCards.push(card);
        }
    }

    const container = document.querySelector('.lista-artistas');
    container.innerHTML = '';

    if (matchedCards.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhum artista ou música encontrada.</p>';
    } else {
        matchedCards.forEach(card => container.appendChild(card));
    }

    document.getElementById('pagination').style.display = 'none';
}

// ===================
// Exibir Artistas (sem biografia)
// ===================
function displayArtists(artists, page) {
    const container = document.querySelector('.lista-artistas');
    container.innerHTML = '';

    const followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');
    const sorted = [...artists].sort((a, b) => followed.includes(b.id) - followed.includes(a.id));

    const start = (page - 1) * artistsPerPage;
    const end = start + artistsPerPage;
    const paginated = sorted.slice(start, end);

    if (paginated.length === 0) {
        container.innerHTML = '<p class="no-results">Nenhum artista encontrado.</p>';
        return;
    }

    paginated.forEach(artist => {
        const isFollowed = followed.includes(artist.id);
        const card = document.createElement('div');
        card.className = 'card-vinil';
        card.setAttribute('data-genre', artist.genres);
        card.onclick = () => selectArtist(artist.id);

        card.innerHTML = `
    <div class="record_case">
        <div class="genre-label">${artist.genres}</div>
        <div class="record recorddefault">
            <div class="front">
                <img src="${artist.capa}" alt="${artist.name}">
                <div class="cover"></div>
                <div class="cover-back"></div>
            </div>
            <div class="vinyl"></div>
            <div class="back">
                <img src="${artist.capa}" alt="${artist.name}">
            </div>
            <div class="right"></div>
            <div class="left"></div>
            <div class="top"></div>
            <div class="bottom"></div>
        </div>
    </div>
    <h3>${artist.name} ${isFollowed ? '<span class="seguindo-icon" title="Seguindo"><i class="fas fa-check-circle" style="color: #2ecc71;"></i></span>' : ''}</h3>
    <p class="music-count">Músicas disponíveis: ${artist.popularTracks ? artist.popularTracks.length : 0}</p>
        `;

        container.appendChild(card);
    });
}

// ===================
// Paginação
// ===================
function setupPagination(artists) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(artists.length / artistsPerPage);
    if (totalPages <= 1) return;

    const createButton = (label, disabled, onClick) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    };

    pagination.appendChild(createButton('&laquo;', currentPage === 1, () => changePage(currentPage - 1)));

    for (let i = 1; i <= totalPages; i++) {
        const btn = createButton(i, false, () => changePage(i));
        if (i === currentPage) btn.classList.add('active');
        pagination.appendChild(btn);
    }

    pagination.appendChild(createButton('&raquo;', currentPage === totalPages, () => changePage(currentPage + 1)));
}

function changePage(page) {
    currentPage = page;
    displayArtists(filteredArtists, currentPage);
    setupPagination(filteredArtists);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================
// Redirecionamento
// ===================
function selectArtist(artistId) {
    window.location.href = `/artista/${artistId}`;
}

document.addEventListener('click', (event) => {
    const dropdown = document.getElementById("dropdown");
    const button = document.querySelector(".dropdown-button");
    if (!dropdown.contains(event.target) && event.target !== button) {
        dropdown.style.display = 'none';
    }
});