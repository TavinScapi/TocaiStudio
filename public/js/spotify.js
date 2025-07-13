const CLIENT_ID = '1ca02f4c12f247de9ef1552f920e191e';
const REDIRECT_URI = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:3000/pages/TocaiMusic.html'
    : 'https://tocaistudio.vercel.app/pages/TocaiMusic.html';
const SCOPE = 'user-read-private user-read-email user-top-read user-follow-read user-read-recently-played streaming';

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const mainContent = document.getElementById('main-content');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const resultsContainer = document.getElementById("searchResults");
const lyricsContainer = document.getElementById("lyrics");
const clearSearchBtn = document.getElementById('clear-search-btn');
const nowPlayingBtn = document.querySelector('.player-btn:nth-of-type(2)');
const nowPlayingSidebar = document.getElementById('now-playing-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebarOverlay = document.createElement('div');
sidebarOverlay.className = 'sidebar-overlay';
document.body.appendChild(sidebarOverlay);

let currentTrack = null;
let searchResultsList = [];
let currentTrackIndex = 0;
let currentTrackId = null;
let currentLyrics = [];
let currentLyricIndex = 0;

checkAuthStatus();

loginBtn.addEventListener('click', () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_type=token&show_dialog=true`;
});
nowPlayingBtn.addEventListener('click', toggleNowPlayingSidebar);
closeSidebarBtn.addEventListener('click', toggleNowPlayingSidebar);
sidebarOverlay.addEventListener('click', toggleNowPlayingSidebar);

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.classList.add('hidden');
    clearSearchBtn.classList.add('hidden');
});

searchInput.addEventListener('input', debounce(() => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    handleSearch();
}, 500));

logoutBtn.addEventListener('click', () => {
    clearAuth();
    window.location.reload();
});

searchInput.addEventListener('input', debounce(handleSearch, 500));
document.getElementById("searchButton").addEventListener("click", handleSearchButton);
document.getElementById("searchInput").addEventListener("keypress", handleSearchEnter);
document.getElementById("prevButton").addEventListener("click", playPreviousTrack);
document.getElementById("nextButton").addEventListener("click", playNextTrack);
document.addEventListener('click', closeSearchResultsOnClickOutside);


function checkAuthStatus() {
    const hash = window.location.hash.substring(1).split('&').reduce((initial, item) => {
        if (item) {
            const parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
    }, {});

    window.location.hash = '';

    if (hash.access_token) {
        localStorage.setItem('spotify_access_token', hash.access_token);
        localStorage.setItem('spotify_token_expiry', Date.now() + (hash.expires_in * 1000));
    }

    const token = localStorage.getItem('spotify_access_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');

    if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        document.body.classList.add('logged-in');
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('header').classList.remove('hidden');
        loadUserData();
    } else {
        clearAuth();
    }
}

function clearAuth() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
    document.body.classList.remove('logged-in');
    mainContent.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    userProfile.classList.add('hidden');
    document.getElementById('player-container').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('header').classList.add('hidden');
}

// User Data Functions
async function loadUserData() {
    loginBtn.classList.add('hidden');
    loading.classList.remove('hidden');
    userProfile.classList.remove('hidden');

    try {
        const accessToken = localStorage.getItem('spotify_access_token');
        const userData = await fetchSpotifyData('https://api.spotify.com/v1/me', accessToken);

        displayUserProfile(userData);
        await loadUserStats(accessToken, userData.id);
        loadTopTracks('short_term', accessToken);
        setupTabs();

        loading.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading user data:', error);
        if (error.status === 401) clearAuth();
        loading.classList.add('hidden');
    }
}

async function fetchSpotifyData(url, accessToken) {
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw await response.json();
    }

    return await response.json();
}

function displayUserProfile(user) {
    const defaultImage = 'https://i.scdn.co/image/ab6775700000ee8518a0a69c96f8e3167f7a837b';
    document.getElementById('user-avatar').src = user.images?.[0]?.url || defaultImage;
    document.getElementById('user-name').textContent = user.display_name;
    document.getElementById('profile-image').src = user.images?.[0]?.url || defaultImage;
    document.getElementById('profile-name').textContent = user.display_name;
}

async function loadUserStats(accessToken, userId) {
    try {
        const [userData, followingData, playlistsData] = await Promise.all([
            fetchSpotifyData('https://api.spotify.com/v1/me', accessToken),
            fetchSpotifyData('https://api.spotify.com/v1/me/following?type=artist&limit=1', accessToken),
            fetchSpotifyData(`https://api.spotify.com/v1/users/${userId}/playlists?limit=1`, accessToken)
        ]);

        document.getElementById('followers-count').textContent = userData.followers?.total || 0;
        document.getElementById('following-count').textContent = followingData.artists?.total || 0;
        document.getElementById('playlists-count').textContent = playlistsData.total || 0;
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Content Display Functions
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            const accessToken = localStorage.getItem('spotify_access_token');
            if (!accessToken) return;

            switch (tabId) {
                case 'top-tracks':
                    const activeTimeRange = document.querySelector('#top-tracks .time-btn.active').getAttribute('data-range');
                    loadTopTracks(activeTimeRange, accessToken);
                    break;
                case 'top-artists':
                    const activeArtistRange = document.querySelector('#top-artists .time-btn.active').getAttribute('data-range');
                    loadTopArtists(activeArtistRange, accessToken);
                    break;
                case 'recently-played':
                    loadRecentlyPlayed(accessToken);
                    break;
            }
        });
    });

    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.parentElement.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const range = this.getAttribute('data-range');
            const accessToken = localStorage.getItem('spotify_access_token');
            if (!accessToken) return;

            const activeTab = document.querySelector('.tab-content.active').id;
            if (activeTab === 'top-tracks') loadTopTracks(range, accessToken);
            else if (activeTab === 'top-artists') loadTopArtists(range, accessToken);
        });
    });
}

async function loadTopTracks(timeRange, accessToken) {
    try {
        loading.classList.remove('hidden');
        const data = await fetchSpotifyData(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`, accessToken);
        displayItems(data.items, 'top-tracks-grid', 'track');
        loading.classList.add('hidden');
    } catch (error) {
        console.error('Error loading top tracks:', error);
        loading.classList.add('hidden');
    }
}

async function loadTopArtists(timeRange, accessToken) {
    try {
        loading.classList.remove('hidden');
        const data = await fetchSpotifyData(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${timeRange}`, accessToken);
        displayItems(data.items, 'top-artists-grid', 'artist');
        loading.classList.add('hidden');
    } catch (error) {
        console.error('Error loading top artists:', error);
        loading.classList.add('hidden');
    }
}

async function loadRecentlyPlayed(accessToken) {
    try {
        loading.classList.remove('hidden');
        const data = await fetchSpotifyData('https://api.spotify.com/v1/me/player/recently-played?limit=50', accessToken);
        displayItems(data.items.map(item => item.track), 'recently-played-grid', 'track');
        loading.classList.add('hidden');
    } catch (error) {
        console.error('Error loading recently played:', error);
        loading.classList.add('hidden');
    }
}

function displayItems(items, containerId, type) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        if (type === 'track') {
            card.innerHTML = `
                <img src="${item.album.images[0].url}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.artists.map(artist => artist.name).join(', ')}</p>
            `;
        } else { // artist
            card.innerHTML = `
                <img src="${item.images[0].url}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.genres.slice(0, 2).join(', ')}</p>
            `;
        }

        card.addEventListener('click', () => {
            window.open(item.external_urls.spotify, '_blank');
        });

        grid.appendChild(card);
    });
}

// Search and Player Functions
function handleSearch() {
    const query = searchInput.value.trim();
    if (query.length < 3) {
        searchResults.classList.add('hidden');
        return;
    }

    performSearch(query);
}

function handleSearchButton() {
    const query = document.getElementById("searchInput").value;
    if (query.trim() !== "") {
        performSearch(query);
    } else {
        alert("Please enter a search term");
    }
}

function handleSearchEnter(event) {
    if (event.key === "Enter") {
        const query = event.target.value.trim();
        if (query !== "") {
            performSearch(query);
        }
    }
}

async function performSearch(query) {
    try {
        const accessToken = localStorage.getItem('spotify_access_token');
        if (!accessToken) return;

        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        displaySearchResults(data.tracks.items);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-result-item">Error searching for tracks</div>';
        searchResults.classList.remove('hidden');
    }
}

function displaySearchResults(tracks) {
    searchResultsList = tracks || [];

    if (!tracks || tracks.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResults.classList.remove('hidden');
        return;
    }

    searchResults.innerHTML = '';
    tracks.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${track.album.images[0].url}" alt="${track.name}">
            <div class="search-result-info">
                <h4>${track.name}</h4>
                <p>${track.artists.map(artist => artist.name).join(', ')} • ${track.album.name}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            playTrackFromSearch(track, index);
            clearSearchBtn.classList.add('hidden'); // Esconde o botão ao selecionar um resultado
        });
        searchResults.appendChild(item);
    });
    searchResults.classList.remove('hidden');
}

// Função para mostrar/ocultar a sidebar
function toggleNowPlayingSidebar() {
    nowPlayingSidebar.classList.toggle('hidden');
    sidebarOverlay.classList.toggle('active');

    // Se a sidebar está sendo aberta e há uma música tocando, atualiza as informações
    if (!nowPlayingSidebar.classList.contains('hidden') && currentTrack) {
        updateNowPlayingInfo(currentTrack);
    }
}

// Modifique a função updateNowPlayingInfo para incluir os novos dados
async function updateNowPlayingInfo(track) {
    // Informações básicas
    document.getElementById('now-playing-image').src = track.album.images[0].url;
    document.getElementById('now-playing-title').textContent = track.name;
    document.getElementById('now-playing-artist').textContent = track.artists.map(artist => artist.name).join(', ');
    document.getElementById('now-playing-album').textContent = track.album.name;

    // Data de lançamento
    const releaseYear = track.album.release_date.split('-')[0];
    document.getElementById('now-playing-release').textContent = releaseYear;

    // Duração
    const durationMs = track.duration_ms;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    document.getElementById('now-playing-duration').textContent = `${minutes}:${seconds.padStart(2, '0')}`;

    // Popularidade
    const popularityStars = Math.round(track.popularity / 20);
    const starsContainer = document.getElementById('popularity-stars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        star.className = i < popularityStars ? 'fas fa-star' : 'far fa-star';
        starsContainer.appendChild(star);
    }

    // Carregar features de áudio
    await loadAudioFeatures(track.id);

    // Carregar detalhes dos artistas
    await loadArtistsDetails(track.artists);

    // Carregar gêneros musicais
    await loadArtistGenres(track.artists[0].id);

    // Configurar ações dos botões
    document.getElementById('view-album').onclick = () => window.open(track.album.external_urls.spotify, '_blank');
    document.getElementById('view-artist').onclick = () => window.open(track.artists[0].external_urls.spotify, '_blank');
}

async function loadAudioFeatures(trackId) {
    try {
        console.log("Procurando elementos da UI...");

        // Verifica se os elementos existem
        const energyEl = document.getElementById('energy-value');
        const valenceEl = document.getElementById('valence-value');
        const tempoEl = document.getElementById('tempo-value');

        if (!energyEl || !valenceEl || !tempoEl) {
            console.error("Elementos não encontrados:", {
                energyEl,
                valenceEl,
                tempoEl
            });
            throw new Error("Elementos da UI não encontrados");
        }

        console.log("Elementos encontrados com sucesso");

        // Restante da função...
        const accessToken = localStorage.getItem('spotify_access_token');
        const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Falha ao carregar features');

        const features = await response.json();

        // Atualiza a UI
        energyEl.textContent = Math.round(features.energy * 100) + '%';
        valenceEl.textContent = Math.round(features.valence * 100) + '%';
        tempoEl.textContent = Math.round(features.tempo);

    } catch (error) {
        console.error('Erro ao carregar audio features:', error);

        // Mostra mensagem de erro mais amigável
        const featuresContainer = document.querySelector('.audio-features');
        if (featuresContainer) {
            featuresContainer.innerHTML = `
                <div class="feature-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Recursos de áudio não disponíveis</span>
                </div>
            `;
        }
    }
}

// Nova função para carregar detalhes dos artistas
async function loadArtistsDetails(artists) {
    try {
        const accessToken = localStorage.getItem('spotify_access_token');
        const artistsContainer = document.getElementById('artists-details');
        artistsContainer.innerHTML = '';

        // Para cada artista, buscar informações detalhadas
        for (const artist of artists) {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artist.id}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) continue;

            const artistData = await response.json();

            const artistCard = document.createElement('div');
            artistCard.className = 'artist-card';
            artistCard.innerHTML = `
                <img src="${artistData.images[0]?.url || 'https://i.scdn.co/image/ab6761610000e5eb8acf72f6b2c3948890c8c8e1'}" alt="${artistData.name}">
                <div class="artist-info">
                    <h4>${artistData.name}</h4>
                    <p>${artistData.followers.total.toLocaleString()} seguidores</p>
                </div>
            `;
            artistCard.addEventListener('click', () => window.open(artistData.external_urls.spotify, '_blank'));
            artistsContainer.appendChild(artistCard);
        }

    } catch (error) {
        console.error('Error loading artist details:', error);
    }
}

// Nova função para carregar gêneros musicais
async function loadArtistGenres(artistId) {
    try {
        const accessToken = localStorage.getItem('spotify_access_token');
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to load artist genres');

        const artistData = await response.json();
        const genresContainer = document.getElementById('genres-container');
        genresContainer.innerHTML = '';

        if (artistData.genres && artistData.genres.length > 0) {
            artistData.genres.forEach(genre => {
                const genreTag = document.createElement('div');
                genreTag.className = 'genre-tag';
                genreTag.textContent = genre;
                genresContainer.appendChild(genreTag);
            });
        } else {
            genresContainer.innerHTML = '<p style="color: #b3b3b3; font-size: 14px;">Nenhum gênero disponível</p>';
        }

    } catch (error) {
        console.error('Error loading artist genres:', error);
    }
}

// Modifique a função playTrackFromSearch para atualizar a sidebar quando uma nova música começa
function playTrackFromSearch(track, index) {
    document.getElementById('player-container').classList.remove('hidden');
    currentTrack = track;
    currentTrackIndex = index;

    const spotifyContainer = document.querySelector('.spotify-iframe-container');
    spotifyContainer.innerHTML = `<iframe id="spotify-iframe" src="https://open.spotify.com/embed/track/${track.id}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;

    searchResults.classList.add('hidden');
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');

    fetchLyrics(track.name, track.artists[0].name);

    // Atualiza a sidebar se estiver aberta
    if (!nowPlayingSidebar.classList.contains('hidden')) {
        updateNowPlayingInfo(track);
    }
}

function playPreviousTrack() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        playTrackFromSearch(searchResultsList[currentTrackIndex], currentTrackIndex);
    } else {
        alert("Você está na primeira faixa.");
    }
}

function playNextTrack() {
    if (currentTrackIndex < searchResultsList.length - 1) {
        currentTrackIndex++;
        playTrackFromSearch(searchResultsList[currentTrackIndex], currentTrackIndex);
    } else {
        alert("Você chegou ao final da lista.");
    }
}

async function fetchLyrics(trackName, artistName) {
    lyricsContainer.innerHTML = "Carregando letra...";
    try {
        const response = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`
        );

        if (!response.ok) throw new Error("Não foi possível encontrar a letra");

        const data = await response.json();
        if (!data.lyrics) throw new Error("Letra não encontrada para esta música");

        currentLyrics = data.lyrics
            .split("\n")
            .filter(line => line.trim() !== "" && !line.includes("[") && !line.includes("]"));

        lyricsContainer.innerHTML = currentLyrics
            .map((line, index) => `<div id="lyric-line-${index}">${line}</div>`)
            .join("");
        currentLyricIndex = 0;
    } catch (error) {
        console.error("Erro ao carregar letra:", error);
        lyricsContainer.innerHTML = "Não foi possível carregar a letra desta música";
    }
}

function closeSearchResultsOnClickOutside(e) {
    if (!searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

async function loadUserPlaylists(accessToken) {
    try {
        const playlistsContainer = document.getElementById('user-playlists');

        // Mostrar loading state com animação melhor
        playlistsContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando suas playlists...</p>
            </div>
        `;

        // Buscar playlists com tratamento de erro melhorado
        const allPlaylists = await fetchAllPaginatedData(
            'https://api.spotify.com/v1/me/playlists?limit=50',
            accessToken
        );

        // Ordenar playlists (as mais recentes primeiro)
        allPlaylists.sort((a, b) => new Date(b.added_at || b.tracks.added_at) - new Date(a.added_at || a.tracks.added_at));

        // Exibir playlists
        if (allPlaylists.length > 0) {
            renderPlaylists(allPlaylists, playlistsContainer);
        } else {
            showNoPlaylistsMessage(playlistsContainer);
        }

    } catch (error) {
        console.error('Error loading playlists:', error);
        showPlaylistsError(playlistsContainer);
    }
}

// Função auxiliar para buscar dados paginados
async function fetchAllPaginatedData(url, accessToken) {
    let allItems = [];

    while (url) {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allItems = [...allItems, ...data.items];
        url = data.next;
    }

    return allItems;
}

// Função para renderizar as playlists
function renderPlaylists(playlists, container) {
    container.innerHTML = '';

    // Criar elemento de lista
    const playlistList = document.createElement('div');
    playlistList.className = 'playlist-grid';

    playlists.forEach(playlist => {
        const playlistItem = createPlaylistElement(playlist);
        playlistList.appendChild(playlistItem);
    });

    container.appendChild(playlistList);
}

// Função para criar o elemento HTML de uma playlist
function createPlaylistElement(playlist) {
    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlist-item';

    // Adicionar classe especial para playlists colaborativas
    if (playlist.collaborative) {
        playlistItem.classList.add('collaborative');
    }

    playlistItem.innerHTML = `
        <div class="playlist-image-container">
            <img src="${playlist.images[0]?.url || 'assets/default-playlist.png'}" 
                 alt="${playlist.name}" 
                 class="playlist-image"
                 loading="lazy">
            ${playlist.tracks.total > 0 ? `<span class="track-count">${playlist.tracks.total}</span>` : ''}
            ${playlist.collaborative ? '<span class="collab-badge">Colab</span>' : ''}
        </div>
        <div class="playlist-info">
            <div class="playlist-name" title="${playlist.name}">${playlist.name}</div>
            <div class="playlist-meta">
                <span class="playlist-owner">${playlist.owner.display_name}</span>
                ${playlist.public ? '<span class="privacy public">Pública</span>' : '<span class="privacy private">Privada</span>'}
            </div>
        </div>
    `;

    // Adicionar eventos
    playlistItem.addEventListener('click', (e) => {
        if (!e.target.closest('.playlist-actions')) {
            window.open(playlist.external_urls.spotify, '_blank');
        }
    });

    // Adicionar menu de contexto (opcional)
    playlistItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showPlaylistContextMenu(e, playlist);
    });

    return playlistItem;
}

// Funções para mensagens de estado
function showNoPlaylistsMessage(container) {
    container.innerHTML = `
        <div class="empty-state">
            <img src="assets/no-playlists.svg" alt="Nenhuma playlist encontrada">
            <h3>Nenhuma playlist encontrada</h3>
            <p>Parece que você ainda não criou nenhuma playlist.</p>
            <button class="btn-create-playlist" id="create-playlist-btn">Criar playlist</button>
        </div>
    `;

    document.getElementById('create-playlist-btn')?.addEventListener('click', () => {
    });
}

function showPlaylistsError(container) {
    container.innerHTML = `
        <div class="error-state">
            <img src="assets/error-loading.svg" alt="Erro ao carregar">
            <h3>Erro ao carregar playlists</h3>
            <p>Não foi possível carregar suas playlists. Por favor, tente novamente.</p>
            <button class="btn-retry" id="retry-load-playlists">Tentar novamente</button>
        </div>
    `;

    document.getElementById('retry-load-playlists')?.addEventListener('click', () => {
        loadUserPlaylists(localStorage.getItem('spotify_access_token'));
    });
}

async function loadUserData() {
    loginBtn.classList.add('hidden');
    loading.classList.remove('hidden');
    userProfile.classList.remove('hidden');

    try {
        const accessToken = localStorage.getItem('spotify_access_token');
        const userData = await fetchSpotifyData('https://api.spotify.com/v1/me', accessToken);

        displayUserProfile(userData);
        await loadUserStats(accessToken, userData.id);
        loadTopTracks('short_term', accessToken);
        loadUserPlaylists(accessToken); // Adicione esta linha
        setupTabs();

        loading.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading user data:', error);
        if (error.status === 401) clearAuth();
        loading.classList.add('hidden');
    }
}