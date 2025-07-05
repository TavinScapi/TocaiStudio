// Funções para o dropdown de gêneros
function toggleDropdown() {
    let dropdown = document.getElementById("dropdown");
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
}

function filterGenres() {
    let input = document.getElementById("searchGenre").value.toLowerCase();
    let items = document.getElementsByClassName("dropdown-item");

    for (let item of items) {
        let text = item.innerText.toLowerCase();
        item.style.display = text.includes(input) ? "block" : "none";
    }
}

function selectGenre(value) {
    document.querySelector(".dropdown-button").innerText = value.charAt(0).toUpperCase() + value.slice(1);
    document.getElementById("dropdown").style.display = "none";
    filterByGenre(value);
}

function filterByGenre(selectedGenre) {
    const cards = document.querySelectorAll('.card-vinil');

    cards.forEach(card => {
        if (selectedGenre === 'todos') {
            card.style.display = 'block'; // Exibe todos os cartões
        } else {
            const cardGenres = card.getAttribute('data-genre').split(' ');
            if (cardGenres.includes(selectedGenre)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

const slider = document.querySelector('.slider');

function activate(e) {
    const items = document.querySelectorAll('.item');
    e.target.matches('.next') && slider.append(items[0])
    e.target.matches('.prev') && slider.prepend(items[items.length - 1]);
}

document.addEventListener('click', activate, false);

// Fecha o dropdown ao clicar fora dele
document.addEventListener("click", function (event) {
    if (!event.target.closest(".filtro-generos")) {
        document.getElementById("dropdown").style.display = "none";
    }
});

function selectArtist(artistId) {
    // Mude para passar por URL em vez de localStorage
    window.location.href = `../pages/Artista.html?artist=${artistId}`;
}

// Carrega os dados do artista na página "Artista.html"
if (window.location.pathname.includes("Artista.html")) {
    const artistKey = localStorage.getItem("selectedArtist");

    if (artistKey && artistsData[artistKey]) {
        const artist = artistsData[artistKey];

        // Atualiza os elementos da página com os dados do artista
        document.getElementById("artist-name").innerText = artist.name;
        document.getElementById("artist-image").src = artist.image;
        document.getElementById("artist-views").innerText = artist.views;
        document.getElementById("artist-history").innerText = artist.history;

        // Preenche a lista de músicas
        const songsList = document.getElementById("artist-songs");
        songsList.innerHTML = "";
        artist.songs.forEach(song => {
            const li = document.createElement("li");
            li.innerHTML = `${song.name} <span class="music-icons">${song.icons}</span>`;
            li.addEventListener("click", () => {
                localStorage.setItem("selectedSong", song.name);
                window.location.href = "../pages/Musica.html";
            });
            songsList.appendChild(li);
        });

        // Preenche a lista de membros
        const membersList = document.getElementById("artist-members");
        membersList.innerHTML = "";
        artist.members.forEach(member => {
            const li = document.createElement("li");
            li.innerText = member;
            membersList.appendChild(li);
        });

        // Preenche a galeria de imagens
        const galleryContainer = document.getElementById("artist-gallery");
        galleryContainer.innerHTML = "";
        artist.gallery.forEach(image => {
            const imgElement = document.createElement("img");
            imgElement.src = image;
            imgElement.alt = `${artist.name} Imagem`;
            imgElement.classList.add("gallery-item");
            galleryContainer.appendChild(imgElement);
        });

        // Preenche a lista de prêmios
        const awardsList = document.getElementById("artist-awards");
        awardsList.innerHTML = "";
        artist.awards.forEach(award => {
            const li = document.createElement("li");
            li.innerText = award;
            awardsList.appendChild(li);
        });
    }
}

// ...existing code...

document.addEventListener('DOMContentLoaded', async function () {
    const listaArtistas = document.querySelector('.lista-artistas');
    if (!listaArtistas) return;

    // Carrega o JSON dos artistas
    const response = await fetch('../data/infoARTISTAS.json');
    const data = await response.json();

    // Pega os 4 últimos artistas (ordem de inserção no objeto)
    const allArtists = Object.entries(data).map(([id, artist]) => ({ id, ...artist }));
    const lastFour = allArtists.slice(-4);

    // Limpa o container
    listaArtistas.innerHTML = '';

    lastFour.forEach(artist => {
        listaArtistas.innerHTML += `
            <div class="card-vinil" data-genre="${artist.genres ? artist.genres.toLowerCase().replace(/ • /g, ' ') : ''}" onclick="selectArtist('${artist.id}')">
                <div class="record_case">
                    <div class="genre-label">${artist.genres || ''}</div>
                    <div class="record recorddefault">
                        <div class="front">
                            <img src="${artist.capa || ''}" alt="${artist.name || ''}">
                            <div class="cover"></div>
                            <div class="cover-back"></div>
                        </div>
                        <div class="vinyl"></div>
                        <div class="back">
                            <img src="${artist.capa || ''}" alt="${artist.name || ''}">
                        </div>
                        <div class="right"></div>
                        <div class="left"></div>
                        <div class="top"></div>
                        <div class="bottom"></div>
                    </div>
                </div>
                <h3>${artist.name || ''}</h3>
                <p>${artist.biography ? artist.biography.split('.')[0] + '.' : ''}</p>
                <button class="button">Ver Mais</button>
            </div>
        `;
    });
});

// ...existing code...