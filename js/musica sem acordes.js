// =====================
// Variáveis Globais
// =====================
let songData = {};
let currentArtistKey = null;
let scrollInterval;
let currentSpeed = 1;
let isScrolling = false;

// =====================
// Inicialização
// =====================
document.addEventListener('DOMContentLoaded', () => {
    loadSelectedSong();

    // Botões de controle
    document.querySelector('.play-btn')?.addEventListener('click', () => {
        console.log('Reproduzindo música...');
    });

    document.querySelector('.like-btn')?.addEventListener('click', function () {
        this.classList.toggle('liked');
    });

    document.querySelector('.add-btn')?.addEventListener('click', () => {
        console.log('Adicionar à playlist...');
    });

    document.querySelector('.share-btn')?.addEventListener('click', () => {
        console.log('Compartilhar música...');
    });
});

// =====================
// Funções Principais
// =====================

// Carrega os dados da música selecionada
function loadSelectedSong() {
    const selectedSong = localStorage.getItem("selectedSong");
    const selectedArtist = localStorage.getItem("selectedArtist");

    if (!selectedArtist || !selectedSong) {
        showError("Música não encontrada");
        return;
    }

    fetch(`../data/artistas/${selectedArtist}.json`)
        .then(response => response.json())
        .then(artistData => {
            songData = artistData;
            currentArtistKey = selectedArtist;

            if (artistData.músicas && artistData.músicas[selectedSong]) {
                const songDetails = artistData.músicas[selectedSong];
                displaySongDetails(selectedSong, artistData, songDetails);
                loadRelatedSongs(selectedArtist, selectedSong);
            } else {
                showError("Música não encontrada");
                loadRelatedSongs(selectedArtist, null);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar JSON do artista:', error);
            showError("Erro ao carregar música");
        });
}

// Exibe os detalhes da música na página
function displaySongDetails(songName, artistData, songDetails) {
    // Informações básicas
    document.getElementById("song-title").textContent = songName;
    document.getElementById("song-artist").textContent = artistData.displayName || currentArtistKey;

    // Metadados
    document.getElementById("song-album").textContent = songDetails.album || "Álbum desconhecido";
    document.getElementById("song-year").textContent = songDetails.year || "Ano desconhecido";
    document.getElementById("song-duration").textContent = formatDuration(songDetails.duration) || "--:--";

    // Informações adicionais
    document.getElementById("song-title").textContent = songName;
    document.getElementById("song-artist").textContent = artistData.displayName || currentArtistKey;
    document.title = `${songName} | Tocaí`;


    // Capa do álbum
    const coverImg = document.getElementById("song-cover-img");
    coverImg.src = songDetails.coverUrl || artistData.artistImage || "../images/default-cover.jpg";
    coverImg.alt = `Capa do álbum ${songDetails.album || ''}`;

    // Cifra
    const chordsContainer = document.getElementById("song-chords");
    if (songDetails.cifra) {
        chordsContainer.innerHTML = formatChords(songDetails.cifra);
    } else if (songDetails.tabs) {
        chordsContainer.innerHTML = formatChords(songDetails.tabs);
    } else {
        chordsContainer.innerHTML = `
            <p class="not-available">Cifra não disponível</p>
            ${songDetails.lyrics ? `<button class="show-lyrics-btn">Mostrar Letra</button>` : ''}
        `;
        if (songDetails.lyrics) {
            chordsContainer.querySelector('.show-lyrics-btn').addEventListener('click', () => {
                document.querySelector('.tab-button[data-tab="lyrics"]').click();
            });
        }
    }

    // Vídeo do YouTube
    const videoIframe = document.getElementById("song-video");
    if (songDetails.videoUrl) {
        let videoId = extractYouTubeId(songDetails.videoUrl);
        if (videoId) {
            videoIframe.src = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`;
            document.querySelector('.video-section').style.display = 'block';
        } else {
            document.querySelector('.video-section').style.display = 'none';
        }
    } else {
        document.querySelector('.video-section').style.display = 'none';
    }

    // Letra
    const lyricsContainer = document.getElementById("song-lyrics");
    if (songDetails.lyrics) {
        lyricsContainer.innerHTML = songDetails.lyrics.replace(/\n/g, '<br>');
    } else {
        lyricsContainer.innerHTML = `
            <p class="not-available">Letra não disponível</p>
            ${songDetails.cifra ? `<button class="show-chords-btn">Mostrar Cifra</button>` : ''}
        `;
        if (songDetails.cifra) {
            lyricsContainer.querySelector('.show-chords-btn').addEventListener('click', () => {
                document.querySelector('.tab-button[data-tab="chords"]').click();
            });
        }
    }

    setupTabs();
    initAutoscrollControls();
}

// Carrega músicas relacionadas
function loadRelatedSongs(artistKey, currentSong) {
    const relatedTracksContainer = document.getElementById("related-tracks");
    relatedTracksContainer.innerHTML = '';

    fetch(`../data/artistas/${artistKey}.json`)
        .then(response => response.json())
        .then(artistData => {
            if (artistData.músicas) {
                const songs = Object.keys(artistData.músicas);
                const relatedSongs = songs.filter(song => song !== currentSong).slice(0, 5);

                if (relatedSongs.length === 0) {
                    relatedTracksContainer.innerHTML = '<p>Nenhuma outra música deste artista</p>';
                    return;
                }

                relatedSongs.forEach(song => {
                    const songDetails = artistData.músicas[song];
                    const trackElement = createRelatedTrackElement(song, songDetails, artistData);
                    relatedTracksContainer.appendChild(trackElement);
                });
            } else {
                relatedTracksContainer.innerHTML = '<p>Nenhuma música relacionada disponível</p>';
            }
        })
        .catch(() => {
            relatedTracksContainer.innerHTML = '<p>Não foi possível carregar músicas relacionadas</p>';
        });
}

// Cria elemento de música relacionada
function createRelatedTrackElement(songName, songDetails, artistData) {
    const trackElement = document.createElement('div');
    trackElement.className = 'related-track';

    trackElement.innerHTML = `
        <div class="related-track-cover">
            <img src="${songDetails.coverUrl || artistData.artistImage || '../images/default-cover.jpg'}" 
                 alt="${songName}">
        </div>
        <div class="related-track-info">
            <div class="related-track-name">${songName}</div>
            <div class="related-track-artist">${artistData.displayName || currentArtistKey}</div>
        </div>
        <div class="related-track-duration">${formatDuration(songDetails.duration) || "--:--"}</div>
    `;

    trackElement.addEventListener('click', () => {
        localStorage.setItem("selectedSong", songName);
        localStorage.setItem("selectedArtist", currentArtistKey);
        loadSelectedSong();
        window.scrollTo(0, 0);
    });

    return trackElement;
}

// Exibe mensagem de erro
function showError(message) {
    document.getElementById("song-title").textContent = message;
    document.getElementById("artist-name").textContent = "";
    document.getElementById("song-lyrics").textContent = "";

    const coverImg = document.getElementById("song-cover-img");
    coverImg.src = "../images/default-cover.jpg";
    coverImg.alt = "Música não encontrada";
}

// =====================
// Sistema de Auto Rolagem
// =====================
function startAutoscroll() {
    if (isScrolling) return;

    const activeTab = document.querySelector('.tab-content.active');
    const container = activeTab.querySelector('.chords-container, .lyrics-container');
    if (!container) return;

    isScrolling = true;
    const scrollStep = 1;
    const maxScroll = container.scrollHeight - container.clientHeight;

    scrollInterval = setInterval(() => {
        if (container.scrollTop >= maxScroll) {
            stopAutoscroll();
            return;
        }
        container.scrollTop += scrollStep * currentSpeed;
    }, 50);
}

function stopAutoscroll() {
    clearInterval(scrollInterval);
    isScrolling = false;
    updateAutoscrollButtons();
}

function updateAutoscrollButtons() {
    const playBtn = document.querySelector('.autoscroll-btn.play');
    const stopBtn = document.querySelector('.autoscroll-btn.stop');

    if (playBtn && stopBtn) {
        playBtn.disabled = isScrolling;
        stopBtn.disabled = !isScrolling;
    }
}

function initAutoscrollControls() {
    const playBtn = document.querySelector('.autoscroll-btn.play');
    const stopBtn = document.querySelector('.autoscroll-btn.stop');
    const speedBtns = document.querySelectorAll('.speed-btn');

    if (playBtn && stopBtn) {
        playBtn.addEventListener('click', () => {
            startAutoscroll();
            updateAutoscrollButtons();
        });

        stopBtn.addEventListener('click', () => {
            stopAutoscroll();
        });
    }

    if (speedBtns) {
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSpeed = parseFloat(btn.dataset.speed);

                if (isScrolling) {
                    stopAutoscroll();
                    startAutoscroll();
                    updateAutoscrollButtons();
                }
            });
        });
    }

    // Pausa ao interagir com o scroll manual
    const containers = document.querySelectorAll('.chords-container, .lyrics-container');
    containers.forEach(container => {
        container.addEventListener('wheel', () => {
            if (isScrolling) {
                stopAutoscroll();
            }
        });
    });
}

// =====================
// Funções Auxiliares
// =====================

// Extrai o ID do vídeo do YouTube
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Formata cifra/tabs para HTML
function formatChords(chordText) {
    return chordText
        .split('\n')
        .map(line => {
            if (line.match(/^(\[[^\]]+\]|\s)+$/)) {
                return `<div class="chord-line">${line.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>')}</div>`;
            }
            return line
                .replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>')
                .replace(/(\s{2,})/g, '<span class="space">$1</span>');
        })
        .join('<br>');
}

// Configura as abas de cifra/letra
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Para o autoscroll ao trocar de aba
            stopAutoscroll();

            // Ativa a aba selecionada
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');

            // Atualiza controles para a nova aba
            initAutoscrollControls();
        });
    });
}

// Formata duração em segundos para mm:ss
function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}