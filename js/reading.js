// ========================================
// Reading Module - Text-to-Speech Functionality
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';

// Store interval ID for cleanup
let pausedStatePreserverInterval = null;

export const Reading = {
    init: function() {
        // Setup section reader buttons (text-to-speech)
        const self = this;
        document.querySelectorAll('.section-reader').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const section = button.closest('.content-section');
                if (section) {
                    self.toggleSectionReading(section, button);
                }
            });
        });

        // Setup expandable content buttons
        elements.expandButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-expand');
                const target = document.getElementById(`expand-${targetId}`);

                if (target) {
                    const isExpanded = this.getAttribute('aria-expanded') === 'true';

                    if (isExpanded) {
                        target.hidden = true;
                        this.setAttribute('aria-expanded', 'false');
                        Utils.announceToScreenReader('Content collapsed');
                    } else {
                        target.hidden = false;
                        this.setAttribute('aria-expanded', 'true');
                        Utils.announceToScreenReader('Content expanded');

                        // Smooth scroll to expanded content
                        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });

        // Stop reading when page is hidden or user navigates away
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAllReading();
            }
        });
    },

    toggleSectionReading: function(section, button) {
        if (!('speechSynthesis' in window)) {
            Utils.announceToScreenReader('Text-to-speech not supported in this browser');
            return;
        }

        const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);

        // Get or initialize reading state for this section
        if (!state.readingState[sectionId]) {
            state.readingState[sectionId] = { playing: false, paused: false, utterance: null, charIndex: 0, fullText: '' };
        }
        const readingState = state.readingState[sectionId];

        // Check button's visual state (most reliable indicator)
        const icon = button.querySelector('span[aria-hidden="true"]');
        const iconText = icon ? icon.textContent.trim() : '';
        const buttonIsPlaying = button.classList.contains('reading-playing') || iconText === '⏸';
        const buttonIsPaused = button.classList.contains('reading-paused') || iconText === '▶';
        const buttonIsStopped = !buttonIsPlaying && !buttonIsPaused;

        // Check speech synthesis actual state
        const isCurrentlySpeaking = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        const isCurrentlyPaused = window.speechSynthesis.speaking && window.speechSynthesis.paused;

        // If another section is playing, pause and save it first
        const isThisSectionPlaying = state.currentReadingSection === sectionId && isCurrentlySpeaking;
        const hasAnotherSectionPlaying = (state.currentReadingSection && state.currentReadingSection !== sectionId) ||
                                         (isCurrentlySpeaking && (!state.currentReadingSection || state.currentReadingSection !== sectionId));

        if (hasAnotherSectionPlaying && !isThisSectionPlaying) {
            const previousSectionId = state.currentReadingSection;
            let previousSection = null;

            if (previousSectionId) {
                previousSection = document.getElementById(previousSectionId) ||
                    Array.from(document.querySelectorAll('.content-section')).find(s => {
                        const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                        return sId === previousSectionId;
                    });
            } else {
                document.querySelectorAll('.content-section').forEach(s => {
                    const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                    const sButton = s.querySelector('.section-reader');
                    if (sButton && sButton.classList.contains('reading-playing')) {
                        previousSection = s;
                        if (!state.currentReadingSection) {
                            state.currentReadingSection = sId;
                        }
                    }
                });
            }

            if (previousSection) {
                const previousButton = previousSection.querySelector('.section-reader');
                const prevSectionId = previousSection.id || 'section-' + Array.from(previousSection.parentElement.children).indexOf(previousSection);
                const previousReadingState = state.readingState[prevSectionId] || state.readingState[state.currentReadingSection];

                if (previousReadingState && previousButton) {
                    if (previousReadingState.utterance) {
                        previousReadingState.utterance.onboundary = null;
                        previousReadingState.utterance.onstart = null;
                        previousReadingState.utterance.onend = null;
                        previousReadingState.utterance.onpause = null;
                        previousReadingState.utterance.onresume = null;
                        previousReadingState.utterance.onerror = null;
                    }

                    if (previousReadingState.startTime) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }

                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    previousReadingState.utterance = null;
                    this.updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }

            setTimeout(() => {
                window.speechSynthesis.cancel();
                state.currentReadingSection = null;

                this.preserveOtherSectionsPausedState();
                this.startPausedStatePreserver();

                setTimeout(() => {
                    const clickedReadingState = state.readingState[sectionId];
                    if (buttonIsPaused && clickedReadingState &&
                        clickedReadingState.charIndex > 0 &&
                        clickedReadingState.fullText &&
                        clickedReadingState.charIndex < clickedReadingState.fullText.length) {
                        this.showReadingResumeOptions(section, button, clickedReadingState);
                    } else {
                        this.preserveOtherSectionsPausedState();
                        this.startReadingSection(section, button, sectionId);
                    }
                }, 100);
            }, 100);
            return;
        }

        // Decision logic based on button's visual state
        if (buttonIsPlaying && (isCurrentlySpeaking || state.currentReadingSection === sectionId)) {
            if (isCurrentlySpeaking) {
                window.speechSynthesis.pause();
            }
            readingState.paused = true;
            readingState.playing = false;
            if (readingState.startTime) {
                const timeElapsed = Date.now() - readingState.startTime;
                const estimatedCharsPerSecond = 150;
                readingState.charIndex = Math.min(
                    readingState.fullText.length,
                    readingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                );
            }
            this.updateReadingButton(button, 'paused', section);
            state.readingState[sectionId] = readingState;
            Utils.announceToScreenReader('Reading paused');
            return;
        }

        if (buttonIsPaused) {
            const currentReadingState = state.readingState[sectionId];

            if (currentReadingState &&
                currentReadingState.charIndex > 0 &&
                currentReadingState.fullText &&
                currentReadingState.charIndex < currentReadingState.fullText.length) {
                this.showReadingResumeOptions(section, button, currentReadingState);
            } else {
                this.startReadingSection(section, button, sectionId);
            }
            return;
        }

        // Button shows stopped or no state - START reading
        if (isCurrentlySpeaking && state.currentReadingSection !== sectionId) {
            const previousSectionId = state.currentReadingSection;
            let previousSection = null;

            if (previousSectionId) {
                previousSection = document.getElementById(previousSectionId) ||
                    Array.from(document.querySelectorAll('.content-section')).find(s => {
                        const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                        return sId === previousSectionId;
                    });
            }

            if (!previousSection) {
                document.querySelectorAll('.content-section').forEach(s => {
                    const sButton = s.querySelector('.section-reader');
                    if (sButton && sButton.classList.contains('reading-playing')) {
                        previousSection = s;
                        const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                        if (!state.currentReadingSection) {
                            state.currentReadingSection = sId;
                        }
                    }
                });
            }

            if (previousSection) {
                const previousButton = previousSection.querySelector('.section-reader');
                const prevSectionId = previousSection.id || 'section-' + Array.from(previousSection.parentElement.children).indexOf(previousSection);
                const previousReadingState = state.readingState[prevSectionId];

                if (previousReadingState && previousButton) {
                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    if (previousReadingState.startTime) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }
                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    this.updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }

            setTimeout(() => {
                window.speechSynthesis.cancel();
                state.currentReadingSection = null;
                setTimeout(() => {
                    this.startReadingSection(section, button, sectionId);
                }, 100);
            }, 50);
        } else {
            this.startReadingSection(section, button, sectionId);
        }

        state.readingState[sectionId] = readingState;
    },

    startReadingSection: function(section, button, sectionId, startFromIndex = 0) {
        const isSpeechPlaying = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        const hasAnotherSection = state.currentReadingSection && state.currentReadingSection !== sectionId;

        if (isSpeechPlaying && hasAnotherSection) {
            const previousSectionId = state.currentReadingSection;
            let previousSection = document.getElementById(previousSectionId) ||
                Array.from(document.querySelectorAll('.content-section')).find(s => {
                    const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                    return sId === previousSectionId;
                });

            if (!previousSection) {
                document.querySelectorAll('.content-section').forEach(s => {
                    const sButton = s.querySelector('.section-reader');
                    if (sButton && sButton.classList.contains('reading-playing')) {
                        previousSection = s;
                    }
                });
            }

            if (previousSection) {
                const previousButton = previousSection.querySelector('.section-reader');
                const prevSectionId = previousSection.id || 'section-' + Array.from(previousSection.parentElement.children).indexOf(previousSection);
                const previousReadingState = state.readingState[prevSectionId];

                if (previousReadingState && previousButton) {
                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    if (previousReadingState.startTime && window.speechSynthesis.speaking) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }
                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    this.updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const sectionText = section.querySelector('.section-content');
        if (!sectionText) return;

        let fullText = sectionText.innerText || sectionText.textContent;
        if (!fullText) return;

        const textToRead = startFromIndex > 0 ? fullText.substring(startFromIndex) : fullText;

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const readingState = state.readingState[sectionId] || {
            playing: false,
            paused: false,
            utterance: null,
            charIndex: 0,
            fullText: '',
            startTime: null
        };

        if (!readingState.fullText || startFromIndex === 0) {
            readingState.fullText = fullText;
        }

        readingState.playing = true;
        readingState.paused = false;
        readingState.utterance = utterance;
        if (startFromIndex > 0) {
            readingState.charIndex = startFromIndex;
        } else {
            readingState.charIndex = 0;
        }
        readingState.startTime = Date.now();

        utterance.onstart = () => {
            readingState.playing = true;
            readingState.paused = false;
            readingState.startTime = Date.now();
            section.classList.add('reading');
            this.updateReadingButton(button, 'playing', section);
            setTimeout(() => {
                this.preserveOtherSectionsPausedState();
                this.startPausedStatePreserver();
            }, 0);
            Utils.announceToScreenReader('Reading section aloud');
        };

        utterance.onend = () => {
            readingState.playing = false;
            readingState.paused = false;
            section.classList.remove('reading', 'reading-playing', 'reading-paused');
            this.updateReadingButton(button, 'stopped', section);
            state.readingState[sectionId] = readingState;
            if (state.currentReadingSection === sectionId) {
                state.currentReadingSection = null;
            }
            Utils.announceToScreenReader('Finished reading section');
        };

        utterance.onerror = (e) => {
            readingState.playing = false;
            readingState.paused = false;
            section.classList.remove('reading');
            this.updateReadingButton(button, 'stopped', section);
            Utils.announceToScreenReader('Error reading section');
        };

        utterance.onboundary = (e) => {
            const currentState = state.readingState[sectionId];
            if (currentState && currentState.utterance === utterance) {
                if (e.name === 'word' && e.charIndex !== undefined) {
                    currentState.charIndex = Math.min(
                        currentState.fullText.length,
                        startFromIndex + e.charIndex
                    );
                    readingState.charIndex = currentState.charIndex;
                    state.readingState[sectionId] = currentState;
                }
            }
        };

        utterance.onpause = () => {
            readingState.paused = true;
            readingState.playing = false;
            if (readingState.startTime) {
                const timeElapsed = Date.now() - readingState.startTime;
                const estimatedCharsPerSecond = 150;
                readingState.charIndex = Math.min(
                    readingState.fullText.length,
                    readingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                );
            }
            this.updateReadingButton(button, 'paused', section);
            state.readingState[sectionId] = readingState;
        };

        utterance.onresume = () => {
            readingState.paused = false;
            readingState.playing = true;
            readingState.startTime = Date.now();
            this.updateReadingButton(button, 'playing', section);
            state.readingState[sectionId] = readingState;
        };

        state.readingState[sectionId] = readingState;
        state.currentReadingSection = sectionId;
        window.speechSynthesis.speak(utterance);
    },

    stopAllReading: function() {
        window.speechSynthesis.cancel();
        state.currentReadingSection = null;
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('reading', 'reading-playing', 'reading-paused');
            const button = section.querySelector('.section-reader');
            if (button) {
                const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
                const readingState = state.readingState[sectionId];
                if (readingState) {
                    readingState.playing = false;
                    if (readingState.charIndex === 0) {
                        readingState.paused = false;
                        this.updateReadingButton(button, 'stopped', section);
                    } else {
                        readingState.paused = true;
                        this.updateReadingButton(button, 'paused', section);
                    }
                } else {
                    this.updateReadingButton(button, 'stopped', section);
                }
            }
        });
    },

    preserveOtherSectionsPausedState: function() {
        document.querySelectorAll('.content-section').forEach(s => {
            const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
            const sButton = s.querySelector('.section-reader');
            const sReadingState = state.readingState[sId];

            if (sReadingState && sReadingState.paused && sReadingState.charIndex > 0 && sButton) {
                const buttonState = sButton.classList.contains('reading-paused') ? 'paused' :
                                   sButton.classList.contains('reading-playing') ? 'playing' : 'stopped';
                if (buttonState !== 'paused') {
                    this.updateReadingButton(sButton, 'paused', s);
                    sReadingState.paused = true;
                    sReadingState.playing = false;
                    state.readingState[sId] = sReadingState;
                }
            }
        });
    },

    startPausedStatePreserver: function() {
        if (pausedStatePreserverInterval) {
            clearInterval(pausedStatePreserverInterval);
        }
        let checks = 0;
        pausedStatePreserverInterval = setInterval(() => {
            this.preserveOtherSectionsPausedState();
            checks++;
            if (checks >= 20) {
                clearInterval(pausedStatePreserverInterval);
                pausedStatePreserverInterval = null;
            }
        }, 100);
    },

    updateReadingButton: function(button, state, section) {
        const icon = button.querySelector('span[aria-hidden="true"]');
        if (!icon) return;

        button.classList.remove('reading-playing', 'reading-paused', 'reading-stopped');
        if (section) {
            section.classList.remove('reading-playing', 'reading-paused');
        }

        switch(state) {
            case 'playing':
                icon.textContent = '⏸';
                button.classList.add('reading-playing');
                if (section) {
                    section.classList.add('reading-playing');
                }
                button.setAttribute('aria-label', 'Pause reading');
                button.title = 'Click to pause reading';
                break;
            case 'paused':
                icon.textContent = '▶';
                button.classList.add('reading-paused');
                if (section) {
                    section.classList.add('reading-paused');
                }
                button.setAttribute('aria-label', 'Resume reading or choose restart');
                button.title = 'Click to resume or restart reading';
                break;
            case 'stopped':
            default:
                icon.textContent = '▶';
                button.classList.add('reading-stopped');
                button.setAttribute('aria-label', 'Read section aloud');
                button.title = 'Click to read section aloud';
                break;
        }
    },

    showReadingResumeOptions: function(section, button, readingState) {
        const existingMenu = section.querySelector('.reading-resume-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        if (!readingState.charIndex || !readingState.fullText) {
            this.startReadingSection(section, button, section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section));
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'reading-resume-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'Reading options');
        menu.innerHTML = `
            <button class="resume-option restart" aria-label="Restart reading from beginning">
                <span aria-hidden="true">↻</span> Restart from Beginning
            </button>
            <button class="resume-option continue" aria-label="Continue from where stopped">
                <span aria-hidden="true">▶</span> Continue from Here
            </button>
        `;

        const sectionHeader = section.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.style.position = 'relative';
            sectionHeader.appendChild(menu);
        } else {
            section.style.position = 'relative';
            section.appendChild(menu);
            menu.style.position = 'absolute';
            menu.style.top = '0';
            menu.style.right = '0';
        }

        const buttonRect = button.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${buttonRect.bottom - sectionRect.top + 8}px`;
        menu.style.right = `${sectionRect.right - buttonRect.right}px`;
        menu.style.zIndex = '10000';

        menu.querySelector('.restart').addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
            state.readingState[sectionId] = { playing: false, paused: false, utterance: null, charIndex: 0, fullText: '' };
            this.startReadingSection(section, button, sectionId, 0);
        });

        menu.querySelector('.continue').addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
            this.startReadingSection(section, button, sectionId, readingState.charIndex || 0);
        });

        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== button) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    },

    readCurrentSection: function() {
        const currentSection = Array.from(elements.sections).find(section => {
            const rect = section.getBoundingClientRect();
            return rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2;
        });

        if (currentSection) {
            const reader = currentSection.querySelector('.section-reader');
            if (reader) {
                reader.click();
            }
        }
    }
};
