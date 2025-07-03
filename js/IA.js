// Configurações
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const API_KEY_STORAGE_KEY = 'harmonia_api_key';
const MAX_HISTORY_LENGTH = 20; // Limite para evitar sobrecarga
const TYPING_INDICATOR_DELAY = 300; // ms antes de mostrar "digitando..."

// Cache de elementos DOM
const elements = {
    apiKeyInput: document.getElementById('apiKey'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    perguntaInput: document.getElementById('pergunta'),
    btnEnviar: document.getElementById('btnEnviar'),
    chatArea: document.getElementById('chatArea'),
    newChatBtn: document.getElementById('newChatBtn'),
    apiKeyModal: document.getElementById('apiKeyModal'),
    closeApiKeyModal: document.getElementById('closeApiKeyModal'),
    maisBtn: document.querySelector('.fa-ellipsis-h').closest('button')
};

// Estado da aplicação
const state = {
    sessionHistory: [],
    isTyping: false,
    typingTimeout: null
};

// Utilidades
const utils = {
    getCurrentTime: () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    scrollToBottom: (element) => {
        element.scrollTop = element.scrollHeight;
    },

    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    sanitizeHTML: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Carregar API Key
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        elements.apiKeyInput.value = savedApiKey;
        displayMessage("Chave API carregada. Pronto para conversar sobre música!", 'ai');
        // SÓ MOSTRA BOAS-VINDAS SE TIVER CHAVE VÁLIDA
        displayMessage("Olá! Eu sou o Harmon, seu assistente musical. Como posso ajudar?", 'ai');
    } else {
        displayMessage("Por favor, insira sua Chave API Gemini e clique em Salvar para começar a usar o HarmonIA.", 'error');
        // NÃO MOSTRA MENSAGEM DE BOAS-VINDAS AQUI
    }

    updateSendButtonState();
}

function setupEventListeners() {
    // Eventos de entrada
    elements.perguntaInput.addEventListener('input', () => {
        updateSendButtonState();
        adjustTextareaHeight();
    });

    elements.perguntaInput.addEventListener('keydown', handleKeyPress);

    // Eventos de clique
    elements.btnEnviar.addEventListener('click', enviarPergunta);
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.newChatBtn.addEventListener('click', startNewChat);

    // Foco no campo de pergunta
    elements.perguntaInput.addEventListener('focus', () => {
        setTimeout(() => {
            elements.perguntaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });

    // Abrir modal ao clicar em "Mais"
    elements.maisBtn.addEventListener('click', () => {
        elements.apiKeyModal.style.display = 'flex';
        elements.apiKeyInput.focus();
    });

    // Fechar modal
    elements.closeApiKeyModal.addEventListener('click', () => {
        elements.apiKeyModal.style.display = 'none';
    });

    // Fechar modal ao clicar fora do conteúdo
    elements.apiKeyModal.addEventListener('click', (e) => {
        if (e.target === elements.apiKeyModal) {
            elements.apiKeyModal.style.display = 'none';
        }
    });
}

// Funções principais
function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();

    if (!apiKey) {
        displayMessage("Por favor, insira uma chave API válida antes de salvar.", 'error');
        return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    displayMessage("Chave API salva com sucesso! Agora você pode fazer perguntas.", 'ai');
}

function startNewChat() {
    elements.chatArea.innerHTML = '';
    state.sessionHistory = [];
    displayMessage("Olá! Eu sou o Harmon. Como posso te ajudar hoje?", 'ai');
}

function handleKeyPress(event) {
    // Sempre permite que o Enter pule linha em dispositivos móveis
    if (event.key === 'Enter' && !isDesktopDevice()) {
        return; // Permite o comportamento padrão (nova linha)
    }

    // Comportamento original para desktop
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!elements.btnEnviar.disabled) {
            enviarPergunta();
        }
    }
}

// Função para detectar se é dispositivo móvel
function isDesktopDevice() {
    return !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

function updateSendButtonState() {
    elements.btnEnviar.disabled = elements.perguntaInput.value.trim() === '';
}

function adjustTextareaHeight() {
    elements.perguntaInput.style.height = 'auto';
    elements.perguntaInput.style.height = `${elements.perguntaInput.scrollHeight}px`;
}

function displayMessage(text, sender = 'ai', customTime = null) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container', `${sender}-message-container`);

    const avatar = createAvatar(sender);
    const messageDiv = createMessageDiv(text, sender, customTime);

    if (sender === 'ai') {
        messageContainer.append(avatar, messageDiv);
    } else {
        messageContainer.append(messageDiv, avatar);
    }

    elements.chatArea.appendChild(messageContainer);
    utils.scrollToBottom(elements.chatArea);

    // Adiciona ao histórico da sessão (formatado para a API Gemini)
    addToSessionHistory(text, sender);
}

function createAvatar(sender) {
    const avatar = document.createElement('img');
    avatar.classList.add('avatar', `${sender}-avatar`);
    avatar.src = 'a';
    avatar.alt = sender === 'ai' ? 'Avatar do Harmon' : 'Seu avatar';
    return avatar;
}

function createMessageDiv(text, sender, customTime) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', `${sender}-message`);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = utils.sanitizeHTML(text);

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('message-time');
    timeSpan.textContent = customTime || utils.getCurrentTime();

    messageDiv.append(contentDiv, timeSpan);

    if (sender === 'ai') {
        const copyBtn = createCopyButton(text);
        messageDiv.prepend(copyBtn);
    }

    return messageDiv;
}

function createCopyButton(text) {
    const copyBtn = document.createElement('button');
    copyBtn.classList.add('copy-btn');
    copyBtn.innerHTML = '<i class="far fa-copy"></i>';
    copyBtn.title = 'Copiar mensagem';

    copyBtn.addEventListener('click', () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        navigator.clipboard.writeText(plainText).then(() => {
            showCopyFeedback(copyBtn);
        });
    });

    return copyBtn;
}

function showCopyFeedback(button) {
    const tooltip = document.createElement('span');
    tooltip.classList.add('copy-tooltip');
    tooltip.textContent = 'Copiado!';
    button.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 2000);
}

function addToSessionHistory(text, sender) {
    const role = sender === 'ai' ? 'model' : 'user';

    // Limita o histórico para evitar sobrecarga
    if (state.sessionHistory.length >= MAX_HISTORY_LENGTH) {
        state.sessionHistory.shift();
    }

    state.sessionHistory.push({
        role,
        parts: [{ text }]
    });
}

function showTypingIndicator() {
    if (state.isTyping) return;

    state.typingTimeout = setTimeout(() => {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typingIndicator';

        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span style="margin-left: 8px; font-size: 13px; color: var(--text-muted)">Harmon está digitando...</span>
        `;

        elements.chatArea.appendChild(typingDiv);
        utils.scrollToBottom(elements.chatArea);
        state.isTyping = true;
    }, TYPING_INDICATOR_DELAY);
}

function hideTypingIndicator() {
    clearTimeout(state.typingTimeout);

    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }

    state.isTyping = false;
}

async function enviarPergunta() {
    const pergunta = elements.perguntaInput.value.trim();
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);

    if (!apiKey) {
        displayMessage("Por favor, insira sua Chave API Gemini e clique em Salvar para continuar.", 'error');
        return;
    }

    if (!pergunta) {
        displayMessage("Por favor, digite uma pergunta.", 'error');
        return;
    }

    // Mostrar mensagem do usuário e limpar campo
    displayMessage(pergunta, 'user');
    elements.perguntaInput.value = '';
    adjustTextareaHeight();
    updateSendButtonState();

    // Mostrar indicador de digitação
    showTypingIndicator();

    try {
        elements.btnEnviar.disabled = true;

        const response = await callGeminiAPI(apiKey, pergunta);
        processAPIResponse(response);

    } catch (error) {
        handleAPIError(error);
    } finally {
        hideTypingIndicator();
        elements.btnEnviar.disabled = false;
    }
}

async function callGeminiAPI(apiKey, pergunta) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: state.sessionHistory,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro desconhecido na API');
    }

    return await response.json();
}

function processAPIResponse(responseData) {
    if (responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiResponse = responseData.candidates[0].content.parts[0].text;
        displayMessage(aiResponse, 'ai');
    } else if (responseData.promptFeedback?.blockReason) {
        const blockReason = responseData.promptFeedback.blockReason;
        displayMessage(`Desculpe, não posso responder a essa pergunta devido a: ${blockReason}`, 'error');
    } else {
        displayMessage("Não consegui entender a resposta da API. Por favor, tente novamente.", 'error');
    }
}

function handleAPIError(error) {
    console.error('Erro:', error);
    displayMessage(`Ocorreu um erro: ${error.message}`, 'error');
}