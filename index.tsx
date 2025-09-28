/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, Chat, Part} from '@google/genai';
import {marked} from 'marked';

declare const hljs: any;
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- Canvas Icon Drawing Functions (Helix - Bioluminescent Style) ---

const createIconCanvas = (size: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    return canvas;
};

const drawPath = (ctx: CanvasRenderingContext2D, path: string, color: string, lineWidth: number = 2) => {
    ctx.beginPath();
    const p = new Path2D(path);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(p);
}

const createLogoIcon = (size: number): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    const accent = 'var(--accent-primary)';
    const primary = 'var(--accent-secondary)';
    drawPath(ctx, 'M12 2a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4', primary, 1.5);
    drawPath(ctx, 'M12 22a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4', accent, 1.5);
    return canvas;
};

const createNewChatIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M12 5v14m-7-7h14', color);
    return canvas;
};

const createSendIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z', color);
    return canvas;
};

const createCameraIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', color, 1.5);
    drawPath(ctx, 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', color, 1.5);
    return canvas;
};

const createAttachIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48', color, 1.5);
    return canvas;
};

const createMicIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z', color, 1.5);
    drawPath(ctx, 'M19 10v2a7 7 0 0 1-14 0v-2', color, 1.5);
    drawPath(ctx, 'M12 19v4 M8 23h8', color, 1.5);
    return canvas;
}

const createCopyIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', color, 1.5);
    drawPath(ctx, 'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z', color, 1.5);
    return canvas;
};

const createStopIcon = (size: number, color: string): HTMLCanvasElement => {
    const canvas = createIconCanvas(size);
    const ctx = canvas.getContext('2d')!;
    drawPath(ctx, 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9 9h6v6H9z', color, 0);
    ctx.fillStyle = color;
    ctx.fill(new Path2D('M9 9h6v6H9z'));
    return canvas;
};

// --- State Management ---
class AppState {
    ai: GoogleGenAI;
    chat: Chat | null = null;
    capturedImageBase64: string | null = null;
    mediaStream: MediaStream | null = null;
    recognition: any | null = null;
    isGenerating: boolean = false;

    constructor() {
        this.ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            this.recognition = new SpeechRecognitionAPI();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
        }
    }

    startNewChat() {
        this.chat = this.ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are Helix, an AI partner that helps developers evolve their ideas into elegant, functional code.
                - Your primary goal is to provide expert assistance, writing clean, efficient, and well-explained code.
                - You are an expert across all modern platforms: web, mobile, backend, and DevOps.
                - When a user provides an image, analyze it and act upon their request with expertise.
                - For code-related tasks, your response must follow this structure:
                1. Start with a clear, concise explanation of the approach.
                2. Provide the complete code. For executable Python, you MUST use the code_execution tool. For all other languages, provide the code in a standard markdown block.
                3. IMPORTANT: Right before any code block (tool or markdown), you MUST specify the language in the format "Language: [language_name]", e.g., "Language: javascript".
                4. If you executed Python code, show the result.`,
                tools: [{codeExecution: {}}],
            },
        });
        this.capturedImageBase64 = null;
        this.isGenerating = false;
    }
}

// --- DOM Element Creation ---
function setupDOM() {
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';

    const headerContainer = document.createElement('div');
    headerContainer.className = 'header-container';
    const headerTitle = document.createElement('div');
    headerTitle.className = 'header-title';
    headerTitle.append(createLogoIcon(24), '<span>Helix</span>');
    const newChatButton = document.createElement('button');
    newChatButton.className = 'new-chat-button';
    newChatButton.append(createNewChatIcon(16, 'var(--text-secondary)'), '<span>New Chat</span>');
    newChatButton.setAttribute('aria-label', 'Start a new chat');
    headerContainer.append(headerTitle, newChatButton);

    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';

    const form = document.createElement('form');
    const imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview-container';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    const promptTextarea = document.createElement('textarea');
    promptTextarea.rows = 1;
    promptTextarea.placeholder = 'Ask Helix...';
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.setAttribute('aria-label', 'Send prompt');
    submitButton.append(createSendIcon(24, 'var(--dark-bg)'));

    const micButton = document.createElement('button');
    micButton.type = 'button';
    micButton.setAttribute('aria-label', 'Use microphone');
    micButton.append(createMicIcon(24, 'var(--text-secondary)'));
    const cameraButton = document.createElement('button');
    cameraButton.type = 'button';
    cameraButton.setAttribute('aria-label', 'Use camera');
    cameraButton.append(createCameraIcon(24, 'var(--text-secondary)'));
    const attachButton = document.createElement('button');
    attachButton.type = 'button';
    attachButton.setAttribute('aria-label', 'Attach file');
    attachButton.append(createAttachIcon(24, 'var(--text-secondary)'));
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const stopGenerationButton = document.createElement('button');
    stopGenerationButton.className = 'stop-generation-button hidden';
    stopGenerationButton.append(createStopIcon(16, 'var(--text-primary)'), '<span>Stop generating</span>');

    const inputButtons = document.createElement('div');
    inputButtons.className = 'input-buttons';
    inputButtons.append(micButton, cameraButton, attachButton);
    inputWrapper.append(promptTextarea, submitButton);
    form.append(imagePreviewContainer, inputWrapper);
    appContainer.append(headerContainer, chatContainer, form, fileInput, stopGenerationButton);
    document.body.append(appContainer);

    return { appContainer, headerContainer, newChatButton, chatContainer, form, imagePreviewContainer, inputWrapper, promptTextarea, submitButton, micButton, cameraButton, attachButton, fileInput, stopGenerationButton };
}

// --- Main Application Logic ---
async function main() {
    const state = new AppState();
    const elements = setupDOM();

    const toggleSubmitButton = (force?: boolean) => {
        const hasText = elements.promptTextarea.value.trim().length > 0;
        const hasImage = !!state.capturedImageBase64;
        const isDisabled = force !== undefined ? force : (!hasText && !hasImage || state.isGenerating);
        if (elements.submitButton.disabled !== isDisabled) {
            elements.submitButton.disabled = isDisabled;
        }
    };

    const updateTextareaHeight = () => {
        elements.promptTextarea.style.height = 'auto';
        elements.promptTextarea.style.height = `${elements.promptTextarea.scrollHeight}px`;
    };
    
    const displayImageThumbnail = (base64: string) => {
        state.capturedImageBase64 = base64;
        const img = document.createElement('img');
        img.src = state.capturedImageBase64;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-button';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => {
            state.capturedImageBase64 = null;
            elements.imagePreviewContainer.innerHTML = '';
            toggleSubmitButton();
        };
        elements.imagePreviewContainer.innerHTML = '';
        elements.imagePreviewContainer.append(img, removeBtn);
        toggleSubmitButton();
    };

    const handleNewChat = () => {
        state.startNewChat();
        elements.chatContainer.innerHTML = '';
        elements.imagePreviewContainer.innerHTML = '';
        elements.stopGenerationButton.classList.add('hidden');
        renderWelcomeScreen(elements.chatContainer, elements.promptTextarea, updateTextareaHeight, toggleSubmitButton);
        toggleSubmitButton();
    };

    elements.newChatButton.addEventListener('click', handleNewChat);
    
    attachEventListeners(elements, state, {
        toggleSubmitButton,
        updateTextareaHeight,
        displayImageThumbnail,
        handleFormSubmit: (prompt, image) => handleFormSubmit(prompt, image, state, elements, { toggleSubmitButton, updateTextareaHeight }),
    });

    handleNewChat();
    toggleSubmitButton();
}

function attachEventListeners(elements, state, actions) {
    const { promptTextarea, form, micButton, attachButton, fileInput, cameraButton, stopGenerationButton } = elements;
    const { updateTextareaHeight, toggleSubmitButton, displayImageThumbnail, handleFormSubmit } = actions;

    promptTextarea.addEventListener('input', () => {
        updateTextareaHeight();
        toggleSubmitButton();
    });

    promptTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const prompt = promptTextarea.value.trim();
        const imageToSend = state.capturedImageBase64;
        if (!prompt && !imageToSend) return;

        promptTextarea.value = '';
        elements.imagePreviewContainer.innerHTML = '';
        state.capturedImageBase64 = null;
        updateTextareaHeight();
        
        handleFormSubmit(prompt, imageToSend);
    });
    
    stopGenerationButton.addEventListener('click', () => {
        state.isGenerating = false;
        stopGenerationButton.classList.add('hidden');
    });

    // File Upload
    attachButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => displayImageThumbnail(reader.result as string);
            reader.readAsDataURL(file);
        }
        fileInput.value = '';
    });

    // Voice Input
    if (state.recognition) {
        micButton.addEventListener('click', () => {
            state.recognition.start();
            micButton.classList.add('listening');
        });
        state.recognition.onresult = (event: any) => {
            promptTextarea.value = event.results[0][0].transcript;
            updateTextareaHeight();
            toggleSubmitButton();
        };
        state.recognition.onend = () => micButton.classList.remove('listening');
        state.recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            micButton.classList.remove('listening');
        };
    } else {
        micButton.style.display = 'none';
    }

    // Camera
    cameraButton.addEventListener('click', async () => {
        const stopCamera = () => {
            if (state.mediaStream) {
                state.mediaStream.getTracks().forEach(track => track.stop());
                state.mediaStream = null;
            }
        };
        const modal = createCameraModal(() => {
            stopCamera();
            modal.modal.remove();
        }, (base64) => {
            displayImageThumbnail(base64);
            stopCamera();
            modal.modal.remove();
        });
        document.body.append(modal.modal);

        try {
            state.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            modal.video.srcObject = state.mediaStream;
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert("Could not access the camera. Please ensure you have granted permission.");
            stopCamera();
            modal.modal.remove();
        }
    });
}

function createCameraModal(onCancel, onCapture) {
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    const container = document.createElement('div');
    container.className = 'camera-container';
    const video = document.createElement('video');
    video.autoplay = true;
    const controls = document.createElement('div');
    controls.className = 'camera-controls';
    const captureButton = document.createElement('button');
    captureButton.id = 'capture-button';
    captureButton.textContent = 'Capture';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    controls.append(captureButton, cancelButton);
    container.append(video, controls);
    modal.append(container);
    
    cancelButton.addEventListener('click', onCancel);
    captureButton.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg'));
    });
    return { modal, video };
}

function renderWelcomeScreen(chatContainer, promptTextarea, updateTextareaHeight, toggleSubmitButton) {
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'welcome-container';
    const examplePromptsContainer = document.createElement('div');
    examplePromptsContainer.className = 'example-prompts';
    const examples = [
        'Create a simple todo-list component in React.',
        'Write a Python script to fetch data from a public API.',
        'Show me how to create a basic button in Swift for an iOS app.',
    ];
    
    const welcomeLogo = createLogoIcon(64);
    const welcomeHeader = document.createElement('h2');
    welcomeHeader.innerHTML = 'Welcome to <span>Helix</span>';
    welcomeContainer.append(welcomeLogo, welcomeHeader);
    
    examples.forEach((promptText) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'example-prompt';
        button.textContent = promptText;
        button.addEventListener('click', () => {
            promptTextarea.value = promptText;
            promptTextarea.focus();
            updateTextareaHeight();
            toggleSubmitButton();
        });
        examplePromptsContainer.append(button);
    });
    welcomeContainer.append(examplePromptsContainer);
    chatContainer.append(welcomeContainer);
}

async function handleFormSubmit(prompt, imageToSend, state, elements, actions) {
    const { chatContainer, stopGenerationButton } = elements;
    const { toggleSubmitButton } = actions;
    if (chatContainer.querySelector('.welcome-container')) {
        chatContainer.innerHTML = '';
    }

    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    if (imageToSend) {
        const img = document.createElement('img');
        img.src = imageToSend;
        userMessage.append(img);
    }
    if (prompt) {
        const p = document.createElement('p');
        p.textContent = prompt;
        userMessage.append(p);
    }
    chatContainer.append(userMessage);

    const modelMessage = document.createElement('div');
    modelMessage.className = 'chat-message model-message';
    const thinkingIndicator = document.createElement('div');
    thinkingIndicator.className = 'thinking-indicator';
    thinkingIndicator.innerHTML = '<div class="loader"><span></span><span></span><span></span></div><span>Helix is thinking...</span>';
    modelMessage.append(thinkingIndicator);
    chatContainer.append(modelMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    state.isGenerating = true;
    toggleSubmitButton(true);
    stopGenerationButton.classList.remove('hidden');

    try {
        const messageParts: Part[] = [];
        if (imageToSend) {
            const [, mimeType, data] = imageToSend.match(/data:(.*?);base64,(.*)/)!;
            messageParts.push({ inlineData: { data, mimeType } });
        }
        if (prompt) {
            messageParts.push({ text: prompt });
        }

        const responseStream = await state.chat.sendMessageStream({ message: messageParts });
        thinkingIndicator.remove();
        
        const streamProcessor = new StreamProcessor(modelMessage, chatContainer, state);
        await streamProcessor.process(responseStream);

    } catch (error) {
        modelMessage.innerHTML = '';
        const errorCard = document.createElement('div');
        errorCard.className = 'error-card';
        const errorBody = (error.message || 'An unknown error occurred.').replace(/\[.*?\]\s/g, '');
        errorCard.innerHTML = `<div class="error-card-header">Error</div><div class="error-card-body">${errorBody}</div>`;
        modelMessage.append(errorCard);
    } finally {
        state.isGenerating = false;
        toggleSubmitButton();
        stopGenerationButton.classList.add('hidden');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

class StreamProcessor {
    modelMessage: HTMLElement;
    chatContainer: HTMLElement;
    state: AppState;
    accumulatedText: string = '';
    detectedLanguage: string = 'python';
    elementsToHighlight: HTMLElement[] = [];
    
    // Card Elements
    textCard?: HTMLDivElement;
    toolCallCard?: HTMLDivElement;
    codeCard?: HTMLDivElement;
    resultCard?: HTMLDivElement;

    constructor(modelMessage: HTMLElement, chatContainer: HTMLElement, state: AppState) {
        this.modelMessage = modelMessage;
        this.chatContainer = chatContainer;
        this.state = state;
    }

    async process(responseStream) {
        for await (const chunk of responseStream) {
            if (!this.state.isGenerating) break; // Check for stop signal

            this.updateText(chunk.text);
            this.updateToolCall(chunk.functionCalls);
            this.updateExecutableCode(chunk.executableCode);
            this.updateResult(chunk.codeExecutionResult);
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
        this.elementsToHighlight.forEach(el => hljs.highlightElement(el));
        if (this.modelMessage.childElementCount === 0) {
            this.modelMessage.innerHTML = '<div class="output-card"><div class="output-card-body">The model did not return any output for this prompt.</div></div>';
        }
    }

    async updateText(text?: string) {
        if (!text) return;

        this.accumulatedText += text;
        const langMatch = this.accumulatedText.match(/Language: (\w+)/i);
        if (langMatch) {
            this.detectedLanguage = langMatch[1].toLowerCase();
            this.accumulatedText = this.accumulatedText.replace(langMatch[0], '').trim();
        }

        if (!this.textCard) {
            this.textCard = document.createElement('div');
            this.textCard.className = 'output-card';
            this.textCard.innerHTML = '<div class="output-card-header">Helix Response</div>';
            const textBody = document.createElement('div');
            textBody.className = 'output-card-body';
            this.textCard.append(textBody);
            this.modelMessage.append(this.textCard);
        }
        const textBody = this.textCard.querySelector('.output-card-body') as HTMLDivElement;
        textBody.innerHTML = await marked.parse(this.accumulatedText);
    }
    
    updateToolCall(functionCalls?: any[]) {
        if (!functionCalls) return;

        const code = functionCalls.map(call => call.args?.code || '').join('');
        if (!this.toolCallCard) {
            this.toolCallCard = document.createElement('div');
            this.toolCallCard.className = 'output-card tool-call-card';
            this.toolCallCard.innerHTML = `<div class="output-card-header"><div class="tool-call-indicator"><div class="loader"><span></span><span></span><span></span></div><span>Executing Code...</span></div></div>`;
            const pre = document.createElement('pre');
            const codeEl = document.createElement('code');
            codeEl.className = 'language-python';
            pre.append(codeEl);
            this.toolCallCard.append(pre);
            this.modelMessage.append(this.toolCallCard);
            this.elementsToHighlight.push(codeEl);
        }
        const toolCodeElement = this.toolCallCard.querySelector('code') as HTMLElement;
        toolCodeElement.textContent = code;
    }

    updateExecutableCode(executableCode?: string) {
        if (!executableCode) return;

        if (this.toolCallCard) {
            this.toolCallCard.remove();
            this.toolCallCard = undefined;
        }
        
        if (!this.codeCard) {
            this.codeCard = document.createElement('div');
            this.codeCard.className = 'output-card code-block-wrapper';
            const header = document.createElement('div');
            header.className = 'output-card-header';
            header.innerHTML = `<span>Language: ${this.detectedLanguage}</span>`;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.append(createCopyIcon(16, 'var(--text-secondary)'), '<span>Copy</span>');
            
            const codeBlock = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.className = `language-${this.detectedLanguage}`;
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(codeElement.textContent || '');
                copyButton.querySelector('span')!.textContent = 'Copied!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.querySelector('span')!.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            });
            
            header.append(copyButton);
            codeBlock.append(codeElement);
            this.codeCard.append(header, codeBlock);
            this.modelMessage.append(this.codeCard);
            this.elementsToHighlight.push(codeElement);
        }
        
        const codeElement = this.codeCard.querySelector('code') as HTMLElement;
        codeElement.textContent = executableCode;
    }
    
    updateResult(result?: string) {
        if (result === undefined) return;

        if (!this.resultCard) {
            this.resultCard = document.createElement('div');
            this.resultCard.className = 'output-card';
            this.resultCard.innerHTML = '<div class="output-card-header">Execution Result</div>';
            const resultBody = document.createElement('pre');
            resultBody.className = 'result-block';
            this.resultCard.append(resultBody);
            this.modelMessage.append(this.resultCard);
        }
        const resultBody = this.resultCard.querySelector('.result-block') as HTMLElement;
        resultBody.textContent = result;
    }
}

main();