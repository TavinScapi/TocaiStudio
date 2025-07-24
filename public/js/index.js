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
    window.location.href = `/artista/${artistId}`;
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
        <div class="album small card-vinil" 
            data-genre="${artist.genres ? artist.genres.toLowerCase().replace(/ • /g, ' ') : ''}" 
            data-cover-url="${artist.capa || ''}" 
            onclick="selectArtist('${artist.id}')">
            <div class="cover">
                <img src="${artist.capa || ''}" alt="${artist.name || ''}">
            </div>
            <div class="vinyl">
                <div class="vinyl-cover"></div>
            </div>
<div class="album-info">
    <strong>${artist.name || ''}</strong>
    <div><span class="info-icon"><i class="fa fa-music"></i></span>Músicas: ${artist.popularTracks ? artist.popularTracks.length : 0}</div>
    <div><span class="info-icon"><i class="fa fa-tag"></i></span>Gênero: ${artist.genres || 'N/A'}</div>
</div>
            <br>
            <h3>${artist.name || ''}</h3>
        </div>
    `;
    });

    // Após inserir os cards:
    document.querySelectorAll('.album').forEach(album => {
        const coverUrl = album.getAttribute('data-cover-url');
        const vinylCover = album.querySelector('.vinyl-cover');
        if (coverUrl && vinylCover) {
            vinylCover.style.backgroundImage = `url('${coverUrl}')`;
        }
    });
});