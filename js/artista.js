// Função para obter parâmetro da URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Função para carregar os dados do artista
async function loadArtistData() {
    // Carregar artistsData de um arquivo JSON externo
    const response = await fetch('../data/infoARTISTAS.json');
    const artistsData = await response.json();

    const artistId = getQueryParam('artist');
    const artist = artistsData[artistId];

    if (!artist) {
        window.location.href = '../pages/Artista&bandas.html';
        return;
    }

    document.getElementById('artist-header').innerHTML = `
    <img src="${artist.avatar}" alt="${artist.name}" class="artist-avatar">
    <div class="artist-info">
        <h1 class="artist-name">${artist.name}</h1>
        <p class="artist-genre">${artist.genres}</p>
        <div class="artist-stats">
            <div class="stat-item">
                <span>🎵</span>
                <span>${artist.stats.songs} músicas</span>
            </div>
            <div class="stat-item">
                <span>📀</span>
                <span>${artist.stats.albums} álbuns</span>
            </div>
            <div class="stat-item">
                <span>👥</span>
                <span>${artist.stats.listeners} ouvintes</span>
            </div>
        </div>
        <button class="btn" id="follow-btn"></button>
    </div>
`;

    const followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');
    const followBtn = document.getElementById('follow-btn');
    function updateFollowBtn() {
        if (followed.includes(artistId)) {
            followBtn.innerHTML = '<i class="fas fa-check"></i> Seguindo';
            followBtn.classList.add('following');
        } else {
            followBtn.innerHTML = 'Seguir';
            followBtn.classList.remove('following');
        }
    }
    updateFollowBtn();

    followBtn.onclick = function () {
        let followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');
        const index = followed.indexOf(artistId);
        if (index === -1) {
            followed.unshift(artistId);
        } else {
            followed.splice(index, 1);
        }
        localStorage.setItem('followedArtists', JSON.stringify(followed));
        updateFollowBtn();
    };

    const popularTracksHTML = artist.popularTracks.map((track, index) => `
    <div class="track-item" data-song="${track.name}">
        <div class="track-number">${index + 1}</div>
        <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="track-album">${track.album} (${track.year})</div>
        </div>
        <div class="track-duration">${track.duration}</div>
    </div>
    `).join('');

    document.getElementById('popular-tracks').innerHTML = popularTracksHTML;

    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const songName = item.getAttribute('data-song');
            const artistId = getQueryParam('artist');
            localStorage.setItem('selectedSong', songName);
            localStorage.setItem('selectedArtist', artistId);
            window.location.href = '../pages/Musica.html';
        });
    });

    const discographyHTML = artist.discography.map(album => `
                <div class="album-card">
                    <img src="${album.cover}" alt="${album.title}" class="album-cover">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-year">${album.year} • ${album.type}</p>
                </div>
            `).join('');

    document.getElementById('discography').innerHTML = discographyHTML;

    document.getElementById('biography').innerHTML = `
                <h2 class="section-title">Biografia</h2>
                <p>${artist.biography}</p>
            `;

    document.title = `${artist.name} | TocaíStudio`;
}

document.addEventListener('DOMContentLoaded', loadArtistData);