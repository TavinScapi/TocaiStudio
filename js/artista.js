// ===========================
// Carregar dados do artista
// ===========================
async function loadArtistData() {
    const response = await fetch('../data/infoARTISTAS.json');
    const artistsData = await response.json();

    // Pega o ID do artista da URL: /artista/NOME
    const pathParts = window.location.pathname.split('/');
    const artistId = pathParts[pathParts.length - 1];

    const artist = artistsData[artistId];

    if (!artist) {
        window.location.href = '/artistas-e-bandas';
        return;
    }

    document.getElementById('artist-header').innerHTML = `
    <img src="${artist.avatar}" alt="${artist.name}" class="artist-avatar">
    <div class="artist-info">
        <h1 class="artist-name">${artist.name}</h1>
        <p class="artist-genre">${artist.genres}</p>
        <div class="artist-stats">
            <div class="stat-item">
                <i class="fa-solid fa-music"></i>
                <span>${artist.stats.songs} músicas</span>
            </div>
            <div class="stat-item">
                <i class="fa-solid fa-compact-disc"></i>
                <span>${artist.stats.albums} álbuns</span>
            </div>
            <div class="stat-item">
                <i class="fa-solid fa-users"></i>
                <span>${artist.stats.listeners} ouvintes</span>
            </div>
        </div>
        <button class="btn" id="follow-btn"></button>
    </div>
    `;

    // Gerenciar botão de seguir
    let followed = JSON.parse(localStorage.getItem('followedArtists') || '[]');
    const followBtn = document.getElementById('follow-btn');

    function updateFollowBtnUI() {
        if (followed.includes(artistId)) {
            followBtn.innerHTML = '<i class="fas fa-check"></i> Seguindo';
            followBtn.classList.add('following');
        } else {
            followBtn.innerHTML = 'Seguir';
            followBtn.classList.remove('following');
        }
    }


    // Atualiza a interface inicialmente
    updateFollowBtnUI();

    // Lida com clique no botão
    followBtn.addEventListener('click', () => {
        const index = followed.indexOf(artistId);

        if (index === -1) {
            followed.push(artistId);
        } else {
            followed.splice(index, 1);
        }

        localStorage.setItem('followedArtists', JSON.stringify(followed));
        updateFollowBtnUI();
    });

    // Preencher músicas populares
    const popularTracksHTML = artist.popularTracks.map((track, index) => `
        <div class="track-item" data-song="${track.id}">
            <div class="track-number">${index + 1}</div>
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-album">${track.album} (${track.year})</div>
            </div>
            <div class="track-duration">${track.duration}</div>
        </div>
    `).join('');

    document.getElementById('popular-tracks').innerHTML = popularTracksHTML;

    // Adicionar click nas músicas
    document.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const songName = item.querySelector('.track-name').textContent;
            window.location.href = `/musica/${artistId}/${encodeURIComponent(songName)}`;
        });
    });

    // URL da imagem padrão para álbum sem capa
    const defaultAlbumCover = '/images/CapaPadrão.webp'; // ajuste o caminho conforme o seu projeto

    const discographyHTML = artist.discography.map(album => {
        const coverSrc = album.cover && album.cover.trim() !== '' ? album.cover : defaultAlbumCover;
        return `
        <div class="album-card">
            <img src="${coverSrc}" alt="${album.title}" class="album-cover">
            <h3 class="album-title">${album.title}</h3>
            <p class="album-year">${album.year} • ${album.type}</p>
        </div>
    `;
    }).join('');


    document.getElementById('discography').innerHTML = discographyHTML;

    document.getElementById('biography').innerHTML = `
    <h2 class="section-title">Biografia</h2>
    ${artist.biography
            .split(/\n{2,}/) // quebra a biografia por blocos de parágrafos
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join('')}
    `;


    document.title = `${artist.name} | TocaíStudio`;
}

document.getElementById('back-to-artist-btn').addEventListener('click', () => {
    window.location.href = '/artistas-e-bandas';
});

document.addEventListener('DOMContentLoaded', loadArtistData);
