let dados = null;

async function carregarAcordes() {
    const resposta = await fetch('../data/guitar.json');
    dados = await resposta.json();
    preencherFiltros();
    exibirAcordes();
}

function preencherFiltros() {
    const notas = Object.keys(dados.chords);
    const tipos = new Set();

    notas.forEach(nota => {
        dados.chords[nota].forEach(acorde => tipos.add(acorde.suffix));
    });

    const notaSelect = document.getElementById('filtro-nota');
    const tipoSelect = document.getElementById('filtro-tipo');

    notas.forEach(nota => {
        const opt = document.createElement('option');
        opt.value = nota;
        opt.textContent = nota;
        notaSelect.appendChild(opt);
    });

    [...tipos].sort().forEach(tipo => {
        const opt = document.createElement('option');
        opt.value = tipo;
        opt.textContent = tipo;
        tipoSelect.appendChild(opt);
    });

    notaSelect.addEventListener('change', exibirAcordes);
    tipoSelect.addEventListener('change', exibirAcordes);
    document.getElementById('busca').addEventListener('input', exibirAcordes);
}

function exibirAcordes() {
    const container = document.getElementById('acordes-lista');
    container.innerHTML = '';

    const filtroNota = document.getElementById('filtro-nota').value;
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const busca = document.getElementById('busca').value.toLowerCase();

    Object.keys(dados.chords).forEach(nota => {
        if (filtroNota && nota !== filtroNota) return;

        dados.chords[nota].forEach(acorde => {
            if (filtroTipo && acorde.suffix !== filtroTipo) return;

            const nome = `${nota} ${acorde.suffix}`.toLowerCase();
            if (busca && !nome.includes(busca)) return;

            acorde.positions.forEach((pos, idx) => {
                const div = document.createElement('div');
                div.classList.add('acorde');

                const titulo = document.createElement('h4');
                titulo.textContent = `${nota} ${acorde.suffix} ${idx + 1}`;
                div.appendChild(titulo);
                div.appendChild(gerarSVG(pos));

                container.appendChild(div);
            });
        });
    });
}

function gerarSVG(posicao) {
    const { frets, barres = [], baseFret = 1 } = posicao;
    const casaInicial = Math.min(...frets.filter(f => f > 0)) || 1;
    // aumente a largura e o deslocamento
    const paddingLeft = 18;
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
        svg.appendChild(criarTexto(baseFret, paddingLeft - 4, 45)); // paddingLeft - 4 deixa alinhado
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

document.addEventListener('DOMContentLoaded', carregarAcordes);
