const tabManager = {
    blocksContainer: document.getElementById('blocks'),
    draggedItem: null,
    dragOverIndex: null,

    addBlock: function () {
        const input = document.getElementById('tabInput').value.trim();
        const lines = input.split('\n').filter(line => line.trim() !== '');

        if (lines.length !== 6) {
            alert("Por favor insira exatamente 6 linhas de tablatura.");
            return;
        }

        const block = document.createElement('div');
        block.className = 'tab-block';
        block.textContent = lines.join('\n');
        block.setAttribute('draggable', true);

        block.addEventListener('dragstart', this.handleDragStart.bind(this));
        block.addEventListener('dragend', this.handleDragEnd.bind(this));
        block.addEventListener('dragover', this.handleDragOver.bind(this));
        block.addEventListener('dragenter', this.handleDragEnter.bind(this));
        block.addEventListener('dragleave', this.handleDragLeave.bind(this));
        block.addEventListener('drop', this.handleDrop.bind(this));

        this.blocksContainer.appendChild(block);
        this.enableDragAndDrop();
        document.getElementById('tabInput').value = '';
        this.updateFullTab();
    },

    enableDragAndDrop: function () {
        this.blocksContainer.querySelectorAll('.tab-block').forEach(block => {
            block.addEventListener('dragstart', this.handleDragStart.bind(this));
            block.addEventListener('dragend', this.handleDragEnd.bind(this));
            block.addEventListener('dragover', this.handleDragOver.bind(this));
            block.addEventListener('dragenter', this.handleDragEnter.bind(this));
            block.addEventListener('dragleave', this.handleDragLeave.bind(this));
            block.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    handleDragStart: function (e) {
        this.draggedItem = e.target;
        e.target.classList.add('drag-ghost');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    },

    handleDragEnd: function (e) {
        e.target.classList.remove('drag-ghost', 'dragging');
        document.querySelectorAll('.tab-block').forEach(block => {
            block.classList.remove('drag-over');
        });
        this.draggedItem = null;
    },

    handleDragOver: function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleDragEnter: function (e) {
        e.preventDefault();
        if (e.target.classList.contains('tab-block')) {
            e.target.classList.add('drag-over');
        }
    },

    handleDragLeave: function (e) {
        e.target.classList.remove('drag-over');
    },

    handleDrop: function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.target.classList.contains('tab-block') && this.draggedItem !== e.target) {
            // Remove todos os estilos de drag-over
            document.querySelectorAll('.tab-block').forEach(block => {
                block.classList.remove('drag-over');
            });

            // Verifica a direção do arraste (para cima ou para baixo)
            const rect = e.target.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const isAfter = e.clientY > midpoint;

            if (isAfter) {
                // Insere depois do elemento alvo
                if (e.target.nextSibling) {
                    this.blocksContainer.insertBefore(this.draggedItem, e.target.nextSibling);
                } else {
                    this.blocksContainer.appendChild(this.draggedItem);
                }
            } else {
                // Insere antes do elemento alvo
                this.blocksContainer.insertBefore(this.draggedItem, e.target);
            }

            this.updateFullTab();
        }
    },

    updateFullTab: function () {
        const blocks = Array.from(document.querySelectorAll('.tab-block'));
        const lines = ["", "", "", "", "", ""];

        blocks.forEach(block => {
            const blockLines = block.textContent.split('\n');
            for (let i = 0; i < 6; i++) {
                lines[i] += (lines[i] ? "  " : "") + (blockLines[i] || "");
            }
        });

        const output = lines.join('\n');
        document.getElementById("fullTabOutput").textContent = output || "Nenhum bloco adicionado ainda.";
    }
};

const playbackManager = {
    currentBlockIndex: 0,
    playing: false,

    playTabs: function () {
        if (this.playing) return;
        this.playing = true;
        const blocks = Array.from(document.querySelectorAll('.tab-block'));
        if (!blocks.length) return;

        const bpm = parseInt(document.getElementById('bpm').value);
        const fullTab = document.getElementById("fullTabOutput");
        const fullLine = document.getElementById("finalPlayLine");
        const container = document.getElementById("finalPlayerContainer");
        const tabLines = fullTab.textContent.split("\n");
        const chars = tabLines[0]?.length || 1;
        const duration = (60 / bpm) * 1000 * chars;

        fullLine.style.display = "block";
        fullLine.style.left = "0";
        fullLine.animate([
            { transform: "translateX(0)" },
            { transform: `translateX(${fullTab.scrollWidth - 10}px)` }
        ], {
            duration: duration,
            fill: "forwards"
        });

        // Scroll acompanha a barra
        let startTime = null;
        const scrollWidth = fullTab.scrollWidth - container.clientWidth;
        function scrollFollowBar(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const percent = Math.min(elapsed / duration, 1);
            container.scrollLeft = percent * scrollWidth;
            if (percent < 1 && playbackManager.playing) {
                requestAnimationFrame(scrollFollowBar);
            }
        }
        requestAnimationFrame(scrollFollowBar);

        // Playback dos blocos
        const playBlock = (block, callback) => {
            const line = document.createElement('div');
            line.className = 'play-line';
            block.appendChild(line);
            const blockDuration = (60 / bpm) * 1000 * block.textContent.split('\n')[0].length;
            line.animate([
                { transform: 'translateX(0)' },
                { transform: `translateX(${block.clientWidth - 10}px)` }
            ], {
                duration: blockDuration,
                fill: 'forwards'
            });
            setTimeout(() => {
                block.removeChild(line);
                callback();
            }, blockDuration);
        };

        const next = () => {
            if (this.currentBlockIndex >= blocks.length) {
                this.playing = false;
                this.currentBlockIndex = 0;
                fullLine.style.display = "none";
                return;
            }
            playBlock(blocks[this.currentBlockIndex], () => {
                this.currentBlockIndex++;
                next();
            });
        };

        next();
    },

    pauseTabs: function () {
        this.playing = false;
        this.currentBlockIndex = 0;
        document.querySelectorAll('.play-line').forEach(l => l.remove());
        document.getElementById('finalPlayLine').style.display = 'none';
    },

    resetTabs: function () {
        this.pauseTabs();
    }
};