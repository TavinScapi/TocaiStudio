let songData = {};
let currentArtistKey = null;
let scrollInterval;
let currentSpeed = 1;
let isScrolling = false;
let player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('song-video');
}

document.addEventListener('DOMContentLoaded', () => {
    loadSelectedSong();

    const playBtn = document.querySelector('.play-btn');
    const playIcon = playBtn?.querySelector('i');

    playBtn?.addEventListener('click', () => {
        if (player && typeof player.getPlayerState === 'function') {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
            } else {
                player.playVideo();
                playIcon.classList.remove('fa-play');
                playIcon.classList.add('fa-pause');
            }
        } else {
            console.log('Player do YouTube não está pronto.');
        }
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
        artistKey ? window.location.href = `/artista/${encodeURIComponent(artistKey)}` : window.history.back();
    });
});

function loadSelectedSong() {
    const [, , selectedArtist = '', selectedSong = ''] = window.location.pathname.split('/').map(decodeURIComponent);

    if (!selectedArtist || !selectedSong) return showError("Música não encontrada");

    fetch(`/data/artistas/${selectedArtist}.json`)
        .then(res => res.json())
        .then(artistData => {
            songData = artistData;
            currentArtistKey = selectedArtist;

            const foundKey = Object.keys(artistData.músicas || {}).find(key =>
                normalizeString(key) === normalizeString(selectedSong)
            );

            if (!foundKey) {
                showError("Música não encontrada");
                loadRelatedSongs(selectedArtist, null);
                return;
            }

            const songDetails = artistData.músicas[foundKey];

            // Agora busca dados extras no infoARTISTAS.json para álbum, ano e duração
            fetch('/data/infoARTISTAS.json')
                .then(res => res.json())
                .then(infoData => {
                    const artistInfo = infoData?.[selectedArtist];
                    const trackInfo = artistInfo?.popularTracks?.find(t =>
                        normalizeString(t.name) === normalizeString(foundKey)
                    );

                    // Se encontrar no infoARTISTAS, substitui as infos de álbum, ano e duração
                    if (trackInfo) {
                        songDetails.album = trackInfo.album || songDetails.album;
                        songDetails.year = trackInfo.year || songDetails.year;
                        songDetails.duration = trackInfo.duration || songDetails.duration;
                    }

                    displaySongDetails(foundKey, artistData, songDetails);
                    loadRelatedSongs(selectedArtist, foundKey);
                })
                .catch(() => {
                    // Se falhar, exibe com os dados locais mesmo
                    displaySongDetails(foundKey, artistData, songDetails);
                    loadRelatedSongs(selectedArtist, foundKey);
                });
        })
        .catch(() => showError("Erro ao carregar música"));
}


function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
}

function displaySongDetails(songName, artistData, songDetails) {
    document.getElementById("song-title").textContent = songName;
    document.getElementById("song-artist").textContent = artistData.displayName || currentArtistKey;
    document.getElementById("song-album").textContent = songDetails.album || "Álbum desconhecido";
    document.getElementById("song-year").textContent = songDetails.year || "Ano desconhecido";
    document.getElementById("song-duration").textContent = songDetails.duration || "--:--";
    document.title = `${songName} | TocaíStudio`;

    const coverImg = document.getElementById("song-cover-img");
    coverImg.src = songDetails.coverUrl || artistData.artistImage || "../images/default-cover.jpg";
    coverImg.alt = `Capa do álbum ${songDetails.album || ''}`;

    const chordsContainer = document.getElementById("song-chords");
    if (songDetails.cifra || songDetails.tabs) {
        const rawTabs = songDetails.cifra || songDetails.tabs;
        const maxLineLength = getMaxLineLengthByScreenWidth();
        const formattedTabs = formatTabsWithBreaks(rawTabs, maxLineLength);
        chordsContainer.innerHTML = formatChords(formattedTabs);
        addChordHoverPopups();
    } else {
        chordsContainer.innerHTML = `
            <p class="not-available">Cifra não disponível</p>
            ${songDetails.lyrics ? `<button class="show-lyrics-btn">Mostrar Letra</button>` : ''}
        `;
        chordsContainer.querySelector('.show-lyrics-btn')?.addEventListener('click', () => {
            document.querySelector('.tab-button[data-tab="lyrics"]').click();
        });
    }

    const videoIframe = document.getElementById("song-video");
    const videoId = extractYouTubeId(songDetails.videoUrl || '');
    if (videoId) {
        videoIframe.src = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&enablejsapi=1`;
        document.querySelector('.video-preview')?.style.setProperty('display', 'block');
        if (player) player.destroy();

        player = new YT.Player('song-video', {
            events: {
                'onStateChange': (event) => {
                    const playIcon = document.querySelector('.play-btn i');
                    if (!playIcon) return;

                    if (event.data === YT.PlayerState.PLAYING) {
                        playIcon.classList.remove('fa-play');
                        playIcon.classList.add('fa-pause');
                    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                        playIcon.classList.remove('fa-pause');
                        playIcon.classList.add('fa-play');
                    }
                }
            }
        });

    } else {
        document.querySelector('.video-preview')?.style.setProperty('display', 'none');
    }

    const lyricsContainer = document.getElementById("song-lyrics");
    if (songDetails.lyrics) {
        lyricsContainer.innerHTML = songDetails.lyrics.replace(/\n/g, '<br>');
    } else {
        lyricsContainer.innerHTML = `
            <p class="not-available">Letra não disponível</p>
            ${songDetails.cifra ? `<button class="show-chords-btn">Mostrar Cifra</button>` : ''}
        `;
        lyricsContainer.querySelector('.show-chords-btn')?.addEventListener('click', () => {
            document.querySelector('.tab-button[data-tab="chords"]').click();
        });
    }

    setupTabs();
    initAutoscrollControls();
    addChordHoverPopups();
}

function loadRelatedSongs(artistKey, currentSong) {
    const container = document.getElementById("related-tracks");
    container.innerHTML = '';

    Promise.all([
        fetch(`/data/artistas/${artistKey}.json`).then(res => res.json()),
        fetch('/data/infoARTISTAS.json').then(res => res.json())
    ])
        .then(([artistData, infoData]) => {
            const songs = Object.keys(artistData.músicas || {});
            const related = songs.filter(song => song !== currentSong).slice(0, 5);

            if (!related.length) {
                container.innerHTML = '<p>Nenhuma outra música deste artista</p>';
                return;
            }

            const artistInfo = infoData?.[artistKey];

            related.forEach(song => {
                let songDetails = artistData.músicas[song];
                if (artistInfo?.popularTracks) {
                    const trackInfo = artistInfo.popularTracks.find(t => normalizeString(t.name) === normalizeString(song));
                    if (trackInfo) {
                        songDetails = {
                            ...songDetails,
                            album: trackInfo.album || songDetails.album,
                            year: trackInfo.year || songDetails.year,
                            duration: trackInfo.duration || songDetails.duration,
                        };
                    }
                }
                const element = createRelatedTrackElement(song, songDetails, artistData);
                container.appendChild(element);
            });
        })
        .catch(() => {
            container.innerHTML = '<p>Não foi possível carregar músicas relacionadas</p>';
        });
}

function createRelatedTrackElement(songName, songDetails, artistData) {
    const el = document.createElement('div');
    el.className = 'related-track';
    el.innerHTML = `
        <div class="related-track-cover">
            <img src="${songDetails.coverUrl || artistData.artistImage || '../images/default-cover.jpg'}" alt="${songName}">
        </div>
        <div class="related-track-info">
            <div class="related-track-name">${songName}</div>
            <div class="related-track-artist">${artistData.displayName || currentArtistKey}</div>
        </div>
        <div class="related-track-duration">${songDetails.duration || "--:--"}</div>
    `;
    el.addEventListener('click', () => {
        window.location.href = `/musica/${encodeURIComponent(currentArtistKey)}/${encodeURIComponent(songName)}`;
    });
    return el;
}

function showError(message) {
    document.getElementById("song-title").textContent = message;
    document.getElementById("artist-name").textContent = "";
    document.getElementById("song-lyrics").textContent = "";
    const img = document.getElementById("song-cover-img");
    img.src = "../images/default-cover.jpg";
    img.alt = "Música não encontrada";
}

function startAutoscroll() {
    if (isScrolling) return;
    const activeTab = document.querySelector('.tab-content.active');
    const container = activeTab.querySelector('.chords-container') || activeTab.querySelector('.lyrics-container');
    if (!container) return;

    isScrolling = true;
    const scrollStep = 1;
    const maxScroll = container.scrollHeight - container.clientHeight;

    scrollInterval = setInterval(() => {
        if (container.scrollTop >= maxScroll) return stopAutoscroll();
        container.scrollTop += scrollStep * currentSpeed;
    }, 50);
}

function stopAutoscroll() {
    clearInterval(scrollInterval);
    isScrolling = false;
    updateAutoscrollButtons();
}

function updateAutoscrollButtons() {
    document.querySelector('.autoscroll-btn.play')?.toggleAttribute('disabled', isScrolling);
    document.querySelector('.autoscroll-btn.stop')?.toggleAttribute('disabled', !isScrolling);
}

function initAutoscrollControls() {
    const playBtn = document.querySelector('.autoscroll-btn.play');
    const stopBtn = document.querySelector('.autoscroll-btn.stop');
    const speedBtns = document.querySelectorAll('.speed-btn');

    playBtn?.addEventListener('click', () => {
        startAutoscroll();
        updateAutoscrollButtons();
    });

    stopBtn?.addEventListener('click', stopAutoscroll);

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

    document.querySelectorAll('.chords-container, .lyrics-container').forEach(container => {
        container.addEventListener('wheel', () => {
            if (isScrolling) stopAutoscroll();
        });
    });
}

function extractYouTubeId(url) {
    const match = url.match(/^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/);
    return match ? match[1] : null;
}

function formatChords(text) {
    const chordRegex = /(?<=^|[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-])([A-G](#|b)?m?(maj7|7M|m7|7|6|9|11|13|sus2|sus4|add9|dim|aug|4|5)?(\([^\)]*\))?(\/[A-G](#|b)?)?)(?=[\s\(\)\[\]\{\},;:\/\\|'"“”‘’\-]|$)/g;
    return text.split('\n').map(line => {
        let formatted = line.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
        formatted = formatted.replace(/(<span class="chord">.*?<\/span>)|([A-G][#b]?m?(?:maj7|7M|m7|7|6|9|11|13|sus2|sus4|add9|dim|aug|4|5)?(?:\([^)]*\))?(?:\/[A-G][#b]?)?)/g,
            (match, chordTag, chord) => chordTag || `<span class="chord">${chord}</span>`);
        return formatted.replace(/(\s{2,})/g, '<span class="space">$1</span>');
    }).join('<br>');
}

function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            stopAutoscroll();
            document.querySelectorAll('.tab-button, .tab-content').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
            initAutoscrollControls();
        });
    });
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function addChordHoverPopups() {
    document.querySelectorAll('#song-chords .chord').forEach(el => {
        el.addEventListener('mouseenter', async e => {
            const chordName = el.textContent.trim();
            const popup = document.getElementById('chord-popup');
            popup.innerHTML = await getChordDiagramSVG(chordName);
            popup.style.display = 'block';
            popup.style.left = `${e.pageX + 10}px`;
            popup.style.top = `${e.pageY + 10}px`;
        });
        el.addEventListener('mousemove', e => {
            const popup = document.getElementById('chord-popup');
            popup.style.left = `${e.pageX + 10}px`;
            popup.style.top = `${e.pageY + 10}px`;
        });
        el.addEventListener('mouseleave', () => {
            document.getElementById('chord-popup').style.display = 'none';
        });
    });
}

function normalizeKey(key) {
    if (/^[A-G]#/.test(key)) return key[0] + 'sharp';
    if (/^[A-G]b/.test(key)) {
        return {
            'Db': 'Csharp',
            'Eb': 'Dsharp',
            'Gb': 'Fsharp',
            'Ab': 'Gsharp',
            'Bb': 'Asharp'
        }[key] || key[0] + 'flat';
    }
    return key;
}

async function getChordDiagramSVG(chordName) {
    const res = await fetch('../data/guitar.json');
    const data = await res.json();
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return '<div style="padding:8px;">Acorde não reconhecido</div>';

    const key = normalizeKey(match[1]);
    const raw = match[2].replace(/\([^)]+\)/g, '').trim();
    const suffix = raw === '' || raw === 'M' ? 'Maior' : raw === '7M' ? 'maj7' : raw;
    const base = suffix.split('/')[0];
    const chordList = data.chords[key];

    if (!chordList) return '<div style="padding:8px;">Acorde não encontrado</div>';
    const chord = chordList.find(c => c.suffix === suffix || c.suffix === base);
    return chord && chord.positions?.length ? gerarSVG(chord.positions[0]).outerHTML : '<div style="padding:8px;">Diagrama não disponível</div>';
}

function gerarSVG(pos) {
    const { frets, barres = [], baseFret = 1 } = pos;
    const casaInicial = Math.min(...frets.filter(f => f > 0)) || 1;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", 110);
    svg.setAttribute("height", 140);

    for (let i = 0; i < 5; i++) svg.appendChild(criarLinha(20, 30 + i * 20, 100, 30 + i * 20));
    for (let i = 0; i < 6; i++) {
        const x = 20 + i * 16;
        svg.appendChild(criarLinha(x, 30, x, 110));
    }
    if (baseFret > 1) svg.appendChild(criarTexto(baseFret, 10, 45));
    barres.forEach(f => svg.appendChild(criarLinha(20, 30 + (f - casaInicial + 0.5) * 20, 100, 30 + (f - casaInicial + 0.5) * 20, 6)));
    frets.forEach((f, i) => {
        const x = 20 + i * 16;
        if (f > 0 && !barres.includes(f)) svg.appendChild(criarCirculo(x, 30 + (f - casaInicial + 0.5) * 20, 5));
        else if (f === 0) svg.appendChild(criarTexto("O", x, 20));
        else if (f === -1) svg.appendChild(criarTexto("X", x, 20));
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

function formatTabsWithBreaks(tabText, maxLineLength = 50) {
    const lines = tabText.split('\n');
    const formattedLines = [];
    let buffer = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detecta início de uma nova parte (ex: "Parte 1 de 4")
        const isNewSection = /^Parte\s+\d+\s+de\s+\d+/i.test(line);
        if (isNewSection) {
            if (buffer.length > 0) {
                formattedLines.push(...splitAndFormatTabBlock(buffer, maxLineLength));
                buffer = [];
            }
            formattedLines.push(line); // Adiciona título da parte
        } else if (/^[EADGBe]\|/.test(line)) {
            buffer.push(line); // Adiciona linha da tablatura (começa com E|, A|, etc.)
            if (buffer.length === 6) {
                formattedLines.push(...splitAndFormatTabBlock(buffer, maxLineLength));
                buffer = [];
            }
        } else {
            if (buffer.length > 0) {
                formattedLines.push(...splitAndFormatTabBlock(buffer, maxLineLength));
                buffer = [];
            }
            formattedLines.push(line); // Linha comum (ex: direcional ↓↑ ou texto)
        }
    }

    // Adiciona qualquer sobra
    if (buffer.length > 0) {
        formattedLines.push(...splitAndFormatTabBlock(buffer, maxLineLength));
    }

    return formattedLines.join('\n');
}

function splitAndFormatTabBlock(lines, maxLength) {
    const result = [];
    const labelLength = lines[0].indexOf('|') + 1;

    // Remove os labels antes de cortar (ex: "E|")
    const strippedLines = lines.map(line => line.slice(labelLength));
    const totalLength = strippedLines[0].length;

    for (let i = 0; i < totalLength; i += maxLength) {
        for (let j = 0; j < lines.length; j++) {
            const label = lines[j].slice(0, labelLength); // "E|"
            const segment = strippedLines[j].slice(i, i + maxLength);
            result.push(label + segment);
        }
        result.push(''); // Espaço entre blocos
    }

    return result;
}

function getMaxLineLengthByScreenWidth() {
    const width = window.innerWidth;

    if (width >= 1200) return 80;   // telas largas
    if (width >= 992) return 70;    // telas desktop menores
    if (width >= 768) return 60;    // tablets
    if (width >= 576) return 40;    // celulares maiores
    return 24;                      // celulares pequenos
}

function updateTabs() {
    if (!songData.músicas) return;

    const rawTabs = songData.músicas[0]?.cifra || songData.músicas[0]?.tabs;
    if (!rawTabs) return;

    const maxLineLength = getMaxLineLengthByScreenWidth();
    const formattedTabs = formatTabsWithBreaks(rawTabs, maxLineLength);

    const chordsContainer = document.getElementById("song-chords");
    chordsContainer.innerHTML = formatChords(formattedTabs);
    addChordHoverPopups();
}

updateTabs();