// Controle do overlay de letras
document.getElementById('lyrics-btn').addEventListener('click', function () {
    const lyricsOverlay = document.getElementById('lyrics-overlay');

    if (lyricsOverlay.classList.contains('active')) {
        // Se o overlay já está aberto, fecha
        closeLyrics();
    } else {
        // Se o overlay está fechado, abre
        openLyrics();
        // Simulação de letras (substitua pela implementação real)
        simulateLyrics();
    }
});

document.getElementById('close-lyrics').addEventListener('click', function () {
    closeLyrics();
});

// Fechar overlay ao pressionar ESC
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeLyrics();
    }
});

function openLyrics() {
    const lyricsOverlay = document.getElementById('lyrics-overlay');
    lyricsOverlay.classList.add('active');
    // Trava o scroll da página
    document.body.style.overflow = 'hidden';
}

function closeLyrics() {
    const lyricsOverlay = document.getElementById('lyrics-overlay');
    lyricsOverlay.classList.remove('active');
    // Libera o scroll da página
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    // Função para fechar a sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
    }

    // Abrir/fechar com o botão de menu
    menuToggle.addEventListener('click', function (e) {
        e.stopPropagation(); // Impede que o evento chegue ao document
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });

    // Fechar ao clicar no overlay
    mobileOverlay.addEventListener('click', closeSidebar);

    // Fechar ao clicar em qualquer lugar do documento
    document.addEventListener('click', function (e) {
        // Verifica se o clique foi fora da sidebar e se ela está aberta
        if (!sidebar.contains(e.target) && sidebar.classList.contains('active') && e.target !== menuToggle) {
            closeSidebar();
        }
    });

    // Impede que o clique dentro da sidebar feche ela
    sidebar.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // Fechar ao pressionar a tecla ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
});

document.getElementById('back-button').addEventListener('click', () => {
    // Volta para a página anterior ou para uma página padrão se não houver histórico
    if (document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.href = '../index.html'; // ou outra página padrão
    }
});