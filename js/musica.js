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

    document.getElementById('back-to-artist-btn')?.addEventListener('click', () => {
        const artistKey = localStorage.getItem('selectedArtist');
        if (artistKey) {
            window.location.href = `Artista.html?artist=${encodeURIComponent(artistKey)}`;
        } else {
            window.history.back();
        }
    });
});

// =====================
// Funções Principais
// =====================

function loadSelectedSong() {
    const pathParts = window.location.pathname.split('/');
    const selectedArtist = decodeURIComponent(pathParts[2] || '');
    const selectedSong = decodeURIComponent(pathParts[3] || '');

    if (!selectedArtist || !selectedSong) {
        showError("Música não encontrada");
        return;
    }

    fetch(`/data/artistas/${selectedArtist}.json`)
        .then(response => response.json())
        .then(artistData => {
            songData = artistData;
            currentArtistKey = selectedArtist;

            if (artistData.músicas) {
                const foundKey = Object.keys(artistData.músicas).find(key =>
                    normalizeString(key) === normalizeString(selectedSong)
                );

                if (foundKey) {
                    const songDetails = artistData.músicas[foundKey];
                    displaySongDetails(foundKey, artistData, songDetails);
                    loadRelatedSongs(selectedArtist, foundKey);
                } else {
                    showError("Música não encontrada");
                    loadRelatedSongs(selectedArtist, null);
                }
            }

        })
        .catch(error => {
            console.error('Erro ao carregar JSON do artista:', error);
            showError("Erro ao carregar música");
        });
}

function normalizeString(str) {
    return str.normalize("NFD") // separa os acentos
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .toLowerCase()
        .replace(/\s+/g, ' ') // normaliza múltiplos espaços
        .trim(); // remove espaços extras nas pontas
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
    document.title = `${songName} | TocaíStudio`;


    // Capa do álbum
    const coverImg = document.getElementById("song-cover-img");
    coverImg.src = songDetails.coverUrl || artistData.artistImage || "../images/default-cover.jpg";
    coverImg.alt = `Capa do álbum ${songDetails.album || ''}`;

    // Cifra
    const chordsContainer = document.getElementById("song-chords");
    if (songDetails.cifra) {
        chordsContainer.innerHTML = formatChords(songDetails.cifra);
        addChordHoverPopups(); // <-- Adicione aqui
    } else if (songDetails.tabs) {
        chordsContainer.innerHTML = formatChords(songDetails.tabs);
        addChordHoverPopups(); // <-- Adicione aqui
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
    addChordHoverPopups();

}

// Carrega músicas relacionadas
function loadRelatedSongs(artistKey, currentSong) {
    const relatedTracksContainer = document.getElementById("related-tracks");
    relatedTracksContainer.innerHTML = '';

    fetch(`/data/artistas/${artistKey}.json`)
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

function formatChords(chordText) {
    // Regex para acordes: C, Dm, F#, E/G#, C#m7(9), B4, E7M, etc
    // Só marca se for isolado (espaço, início/fim de linha, pontuação)
    const chordRegex = /(?<=^|[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-])([A-G](#|b)?m?(maj7|7M|m7|7|6|9|11|13|sus2|sus4|add9|dim|aug|4|5)?(\([^\)]*\))?(\/[A-G](#|b)?)?)(?=[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-]|$)/g;

    return chordText
        .split('\n')
        .map(line => {
            // Marca acordes entre colchetes
            let formatted = line.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
            // Marca acordes soltos (não dentro de tags já)
            formatted = formatted.replace(/(<span class="chord">.*?<\/span>)|(?<=^|[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-])([A-G](#|b)?m?(maj7|7M|m7|7|6|9|11|13|sus2|sus4|add9|dim|aug|4|5)?(\([^\)]*\))?(\/[A-G](#|b)?)?)(?=[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-]|$)/g, (match, chordTag, chord) => {
                if (chordTag) return chordTag; // já está marcado
                // Só marca se for acorde isolado OU tiver mais de 1 caractere
                if (chord && (chord.length > 1 || /^[A-G]$/.test(chord))) return `<span class="chord">${chord}</span>`;
                return match;
            });
            // Mantém espaçamento visual
            return formatted.replace(/(\s{2,})/g, '<span class="space">$1</span>');
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

function addChordHoverPopups() {
    const chordElements = document.querySelectorAll('#song-chords .chord');
    chordElements.forEach(el => {
        el.addEventListener('mouseenter', async (e) => {
            const chordName = el.textContent.trim();
            const popup = document.getElementById('chord-popup');
            popup.innerHTML = await getChordDiagramSVG(chordName);
            popup.style.display = 'block';
            // Posição do mouse
            popup.style.left = (e.pageX + 10) + 'px';
            popup.style.top = (e.pageY + 10) + 'px';
        });
        el.addEventListener('mousemove', (e) => {
            const popup = document.getElementById('chord-popup');
            popup.style.left = (e.pageX + 10) + 'px';
            popup.style.top = (e.pageY + 10) + 'px';
        });
        el.addEventListener('mouseleave', () => {
            document.getElementById('chord-popup').style.display = 'none';
        });
    });
}

function normalizeKey(key) {
    // Converte F# para Fsharp, Bb para Asharp, etc.
    if (/^[A-G]#/.test(key)) return key[0] + 'sharp';
    if (/^[A-G]b/.test(key)) {
        return ({
            'Db': 'Csharp',
            'Eb': 'Dsharp',
            'Gb': 'Fsharp',
            'Ab': 'Gsharp',
            'Bb': 'Asharp'
        })[key] || key[0] + 'flat';
    }
    return key;
}

async function getChordDiagramSVG(chordName) {
    const response = await fetch('../data/guitar.json');
    const data = await response.json();

    const match = chordName.match(/^([A-G](#|b)?)(.*)$/);
    if (!match) return '<div style="padding:8px;">Acorde não reconhecido</div>';

    let key = match[1]; // Ex: C, C#, Bb
    let rawSuffix = match[3].trim();

    // Remove extensões entre parênteses para busca do diagrama
    let cleanSuffix = rawSuffix.replace(/\([^\)]*\)/g, '').trim();

    let jsonKey = normalizeKey(key);

    let suffix = '';
    if (cleanSuffix === '' || cleanSuffix === 'M' || cleanSuffix === 'maj') {
        suffix = 'Maior';
    } else if (cleanSuffix === 'm') {
        suffix = 'm';
    } else if (cleanSuffix === '7M' || cleanSuffix === 'maj7') {
        suffix = 'maj7';
    } else if (cleanSuffix === 'm7') {
        suffix = 'm7';
    } else if (cleanSuffix === 'm6') {
        suffix = 'm6';
    } else if (cleanSuffix === 'm9') {
        suffix = 'm9';
    } else if (cleanSuffix === 'm11') {
        suffix = 'm11';
    } else if (cleanSuffix === 'm13') {
        suffix = 'm13';
    } else if (cleanSuffix === 'sus4') {
        suffix = 'sus4';
    } else if (cleanSuffix === 'sus2') {
        suffix = 'sus2';
    } else if (cleanSuffix === '4') {
        suffix = 'sus4';
    } else {
        suffix = cleanSuffix;
    }

    let baseSuffix = suffix.split('/')[0];

    let chordList = data.chords[jsonKey];
    if (!chordList) return '<div style="padding:8px;">Acorde não encontrado</div>';

    // Debug
    // console.log('jsonKey:', jsonKey, 'suffix:', suffix, 'disponíveis:', chordList.map(c => c.suffix));

    let chord = chordList.find(c => c.suffix === suffix || c.suffix === baseSuffix);
    if (!chord || !chord.positions || !chord.positions.length)
        return '<div style="padding:8px;">Diagrama não disponível</div>';

    return gerarSVG(chord.positions[0]).outerHTML;
}


function gerarSVG(posicao) {
    const { frets, barres = [], baseFret = 1 } = posicao;
    const casaInicial = Math.min(...frets.filter(f => f > 0)) || 1;
    // diminua o padding
    const paddingLeft = 10;
    const largura = 100 + paddingLeft, altura = 140;
    const espacamento = 20;
    const raio = 5;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", largura);
    svg.setAttribute("height", altura);

    for (let i = 0; i < 5; i++) {
        svg.appendChild(criarLinha(10 + paddingLeft, 30 + i * espacamento, 90 + paddingLeft, 30 + i * espacamento));
    }

    for (let i = 0; i < 6; i++) {
        const x = 10 + paddingLeft + i * (100 - 20) / 5;
        svg.appendChild(criarLinha(x, 30, x, 30 + 4 * espacamento));
    }

    // Exibir número da casa inicial se for maior que 1
    if (baseFret > 1) {
        svg.appendChild(criarTexto(baseFret, paddingLeft - 2, 45)); // ajuste fino para o novo padding
    }

    // Pestanas
    barres.forEach(barreCasa => {
        const y = 30 + (barreCasa - casaInicial + 0.5) * espacamento;
        svg.appendChild(criarLinha(10 + paddingLeft, y, 90 + paddingLeft, y, 6));
    });

    // Posições normais (círculos, X e O)
    frets.forEach((fret, i) => {
        const x = 10 + paddingLeft + i * (100 - 20) / 5;
        if (fret > 0 && !barres.includes(fret)) {
            const y = 30 + (fret - casaInicial + 0.5) * espacamento;
            svg.appendChild(criarCirculo(x, y, raio));
        } else if (fret === 0) {
            svg.appendChild(criarTexto("O", x, 20));
        } else if (fret === -1) {
            svg.appendChild(criarTexto("X", x, 20));
        }
    });

    return svg;
}

function criarLinha(x1, y1, x2, y2, strokeWidth = 1) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1);
    l.setAttribute("y1", y1);
    l.setAttribute("x2", x2);
    l.setAttribute("y2", y2);
    l.setAttribute("stroke", "#000");
    l.setAttribute("stroke-width", strokeWidth);
    return l;
}

function criarCirculo(cx, cy, r) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx);
    c.setAttribute("cy", cy);
    c.setAttribute("r", r);
    c.setAttribute("fill", "black");
    return c;
}

function criarTexto(txt, x, y) {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "12");
    t.textContent = txt;
    return t;
}