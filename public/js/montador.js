(() => {
    // Variáveis globais
    let savedTabs = [];

    // Funções de abas
    function openTab(tabId, event) {
        const tabs = document.querySelectorAll('.tab-content');
        const btns = document.querySelectorAll('.tab-btn');

        tabs.forEach((tab) => tab.classList.remove('active'));
        btns.forEach((btn) => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
        });

        const currentTab = document.getElementById(tabId);
        currentTab.classList.add('active');

        const currentBtn = event.currentTarget;
        currentBtn.classList.add('active');
        currentBtn.setAttribute('aria-selected', 'true');
        currentBtn.setAttribute('tabindex', '0');
        currentBtn.focus();

        if (tabId === 'chords-tab') populateChordsEditor();
        if (tabId === 'tabs') populateTabsEditor();
    }

    // Letra - adicionar seção
    function addSection(sectionName) {
        const textarea = document.getElementById('song-lyrics');
        const cursorPos = textarea.selectionStart;
        const before = textarea.value.substring(0, cursorPos);
        const after = textarea.value.substring(cursorPos);
        const sectionText = `\n\n[${sectionName}]\n`;

        textarea.value = before + sectionText + after;
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = cursorPos + sectionText.length;

        updatePreview();
    }

    // Acordes
    function populateChordsEditor() {
        const lyrics = document.getElementById('song-lyrics').value;
        const chordsEditor = document.getElementById('chords-editor');
        chordsEditor.innerHTML = '';

        const lines = lyrics.split('\n');
        lines.forEach((line) => {
            const chordLine = document.createElement('div');
            chordLine.className = 'chord-line';
            chordLine.contentEditable = 'true';
            chordLine.spellcheck = false;
            chordLine.setAttribute('aria-label', 'Linha de acordes');
            chordLine.setAttribute('role', 'textbox');

            const lyricLine = document.createElement('div');
            lyricLine.className = 'lyric-line';
            lyricLine.textContent = line || '\u00A0';

            chordsEditor.appendChild(chordLine);
            chordsEditor.appendChild(lyricLine);
        });
    }

    function saveChordsEditor() {
        const chordsEditor = document.getElementById('chords-editor');
        const children = chordsEditor.children;
        let newLyrics = '';

        for (let i = 0; i < children.length; i += 2) {
            const chordLine = children[i].textContent.trim();
            const lyricLine = children[i + 1].textContent;

            if (chordLine) newLyrics += `[${chordLine}]\n`;
            newLyrics += lyricLine + '\n';
        }

        document.getElementById('song-lyrics').value = newLyrics.trim();
        updatePreview();
        showStatus('Acordes salvos na letra!', true);
    }

    // Tablaturas linha a linha
    function populateTabsEditor() {
        const lyrics = document.getElementById('song-lyrics').value;
        const tabsEditor = document.getElementById('tab-lines-editor');
        tabsEditor.innerHTML = '';

        const lines = lyrics.split('\n');
        lines.forEach((line) => {
            const lyricLine = document.createElement('div');
            lyricLine.className = 'lyric-line';
            lyricLine.textContent = line || '\u00A0';

            const tabLine = document.createElement('div');
            tabLine.className = 'chord-line';
            tabLine.contentEditable = 'true';
            tabLine.spellcheck = false;
            tabLine.setAttribute('aria-label', 'Linha de tablatura para a linha acima');
            tabLine.setAttribute('role', 'textbox');
            tabLine.style.color = '#444';
            tabLine.style.fontFamily = 'Fira Code, monospace';
            tabLine.style.minHeight = '1.6em';

            tabsEditor.appendChild(lyricLine);
            tabsEditor.appendChild(tabLine);
        });
    }

    function saveTabsEditor() {
        const tabsEditor = document.getElementById('tab-lines-editor');
        const children = tabsEditor.children;
        let newLyrics = '';

        for (let i = 0; i < children.length; i += 2) {
            const lyricText = children[i].textContent || '';
            const tabText = children[i + 1].textContent.trim();

            newLyrics += lyricText + '\n';
            if (tabText) newLyrics += `[TAB]\n${tabText}\n[/TAB]\n`;
        }

        document.getElementById('song-lyrics').value = newLyrics.trim();
        updatePreview();
        showStatus('Tablaturas salvas na letra!', true);
    }

    // Editor de tablatura manual
    function copiarTab() {
        const tabText = document.getElementById('tab-input').value;
        navigator.clipboard
            .writeText(tabText)
            .then(() => showStatus('Tablatura copiada para a área de transferência!', true))
            .catch(() => showStatus('Erro ao copiar a tablatura.', false));
    }

    function limparTab() {
        const tabInput = document.getElementById('tab-input');
        tabInput.value = `e|-----------------------------------------------------------------------|
B|-----------------------------------------------------------------------|
G|-----------------------------------------------------------------------|
D|-----------------------------------------------------------------------|
A|-----------------------------------------------------------------------|
E|-----------------------------------------------------------------------|`;
        tabInput.focus();
        showStatus('Tablatura limpa!', true);
    }

    // Geração da cifra e preview
    function generateCifra() {
        const title = document.getElementById('song-title').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const key = document.getElementById('song-key').value;
        const tuning = document.getElementById('tuning').value;
        const capo = document.getElementById('capo').value.trim();
        const lyrics = document.getElementById('song-lyrics').value;

        if (!title || !lyrics) {
            showStatus('Título e letra são obrigatórios!', false);
            return;
        }

        let cifraHTML = `<div class="tocai-tab-container">
      <h1 class="tocai-title">${title}</h1>
      <span class="tocai-artist">${artist || 'Artista desconhecido'}</span>`;

        if (key || tuning || capo) {
            cifraHTML += `<div class="tocai-meta">`;
            if (key) cifraHTML += `<span class="tocai-key">Tom: ${key}</span>`;
            if (tuning) cifraHTML += `<span class="tocai-tuning">Afinação: ${tuning}</span>`;
            if (capo) cifraHTML += `<span class="tocai-capo">Capotraste: ${capo}</span>`;
            cifraHTML += `</div>`;
        }

        // Processa letras com acordes e tablaturas formatadas
        const processedLyrics = lyrics
            .replace(/\[TAB\]([\s\S]*?)\[\/TAB\]/g, '<pre class="tocai-tablature">$1</pre>')
            .replace(/\[([^\]]+)\]/g, (match, p1) => {
                if (match.startsWith('[TAB') || match.startsWith('[/TAB')) return match;
                return `<span class="tocai-chord">${p1}</span>`;
            });

        cifraHTML += `<div class="tocai-tab-font">${processedLyrics.replace(/\n/g, '<br>')}</div></div>`;

        document.getElementById('cifra-preview').innerHTML = cifraHTML;
        showStatus('Cifra gerada com sucesso!', true);
    }

    function updatePreview() {
        generateCifra();
    }

    // Status
    function showStatus(message, success) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = success ? 'status success' : 'status error';
        statusEl.style.display = 'block';
        statusEl.style.opacity = '1';

        clearTimeout(showStatus.timeout);
        showStatus.timeout = setTimeout(() => {
            statusEl.style.opacity = '0';
            setTimeout(() => {
                statusEl.style.display = 'none';
                statusEl.textContent = '';
            }, 500);
        }, 3000);
    }

    // Inserir tab na letra
    function insertTabAtCursor(tabText) {
        const lyricsTextarea = document.getElementById('song-lyrics');
        const cursorPos = lyricsTextarea.selectionStart;
        const before = lyricsTextarea.value.substring(0, cursorPos);
        const after = lyricsTextarea.value.substring(cursorPos);
        const tabTag = `\n[TAB]\n${tabText}\n[/TAB]\n`;

        lyricsTextarea.value = before + tabTag + after;
        lyricsTextarea.focus();
        lyricsTextarea.selectionStart = lyricsTextarea.selectionEnd = cursorPos + tabTag.length;

        generateCifra();
    }

    // Gerenciar abas extras: salvar, inserir e limpar tabs
    function refreshSavedTabsList() {
        const savedTabsList = document.getElementById('saved-tabs-list');
        if (!savedTabsList) return;
        savedTabsList.innerHTML = '';
        if (savedTabs.length === 0) {
            savedTabsList.innerHTML = '<em>Nenhuma tab salva ainda.</em>';
            return;
        }

        savedTabs.forEach((tabText, i) => {
            const div = document.createElement('div');
            div.style.borderBottom = '1px solid #00bcd4';
            div.style.padding = '0.3rem 0';
            div.style.cursor = 'pointer';
            div.title = 'Clique para inserir essa tab na letra';
            div.textContent =
                tabText.length > 60
                    ? tabText.slice(0, 60).replace(/\n/g, ' ') + '...'
                    : tabText.replace(/\n/g, ' ');

            div.addEventListener('click', () => {
                insertTabAtCursor(tabText);
                showStatus('Tab inserida na letra!', true);
            });

            savedTabsList.appendChild(div);
        });
    }

    // Eventos
    document.getElementById('song-title').addEventListener('input', generateCifra);
    document.getElementById('artist').addEventListener('input', generateCifra);
    document.getElementById('song-key').addEventListener('change', generateCifra);
    document.getElementById('tuning').addEventListener('change', generateCifra);
    document.getElementById('capo').addEventListener('input', generateCifra);
    document.getElementById('song-lyrics').addEventListener('input', generateCifra);
    document.getElementById('save-chords-btn').addEventListener('click', saveChordsEditor);
    document.getElementById('save-tabs-btn').addEventListener('click', saveTabsEditor);

    // Inicialização
    refreshSavedTabsList();
    generateCifra();

    // Expor funções para o escopo global para uso inline (botões)
    window.openTab = openTab;
    window.addSection = addSection;
    window.saveChordsEditor = saveChordsEditor;
    window.saveTabsEditor = saveTabsEditor;
    window.copiarTab = copiarTab;
    window.limparTab = limparTab;
    window.copyCifra = () => {
        const cifraPreview = document.getElementById('cifra-preview').innerText;
        navigator.clipboard
            .writeText(cifraPreview)
            .then(() => showStatus('Cifra copiada para a área de transferência!', true))
            .catch(() => showStatus('Erro ao copiar a cifra.', false));
    };
    window.clearAll = () => {
        if (confirm('Deseja realmente limpar todos os campos?')) {
            document.getElementById('song-title').value = '';
            document.getElementById('artist').value = '';
            document.getElementById('song-key').value = '';
            document.getElementById('tuning').value = '';
            document.getElementById('capo').value = '';
            document.getElementById('song-lyrics').value = '';
            document.getElementById('chords-editor').innerHTML = '';
            document.getElementById('tab-lines-editor').innerHTML = '';
            generateCifra();
            showStatus('Tudo limpo!', true);
        }
    };
})();