// ========================================
// Accessibility Controls Module
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';

export const Accessibility = {
    init: function() {
        if (elements.contrastToggle) {
            elements.contrastToggle.addEventListener('click', () => {
                this.toggleHighContrast();
                Utils.savePreferences();
            });
        }
        if (elements.fontIncrease) {
            elements.fontIncrease.addEventListener('click', () => {
                this.adjustFontSize(state.fontScale);
                Utils.savePreferences();
            });
        }
        if (elements.fontDecrease) {
            elements.fontDecrease.addEventListener('click', () => {
                this.adjustFontSize(-state.fontScale);
                Utils.savePreferences();
            });
        }
        if (elements.fontReset) {
            elements.fontReset.addEventListener('click', () => {
                this.resetFontSize();
                Utils.savePreferences();
            });
        }
        if (elements.skipAnimations) {
            elements.skipAnimations.addEventListener('click', () => {
                this.toggleReduceMotion();
                Utils.savePreferences();
            });
        }
        if (elements.focusMode) {
            elements.focusMode.addEventListener('click', () => {
                this.toggleFocusMode();
                Utils.savePreferences();
            });
        }
        if (elements.readingGuide) {
            elements.readingGuide.addEventListener('click', () => {
                this.toggleReadingGuide();
                Utils.savePreferences();
            });
        }

        // Initial setup for reading guide
        this.setupReadingGuide();
    },

    toggleHighContrast: function() {
        state.highContrast = !state.highContrast;
        elements.body.classList.toggle('high-contrast', state.highContrast);
        Utils.updateButtonState(elements.contrastToggle, state.highContrast);
        Utils.announceToScreenReader(state.highContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
    },

    adjustFontSize: function(change) {
        if (!elements.fontIncrease || !elements.fontDecrease) return;

        state.fontSize = Math.max(0.5, Math.min(2, state.fontSize + change));
        const newSize = state.baseFontSize * state.fontSize;
        document.documentElement.style.fontSize = `${newSize}px`;
        elements.body.style.fontSize = ''; // Clear body font size to allow html font-size to take effect
        Utils.announceToScreenReader(`Zoom: ${Math.round(state.fontSize * 100)}%`);
    },

    resetFontSize: function() {
        if (!elements.fontReset) return;

        state.fontSize = 1;
        document.documentElement.style.fontSize = '';
        elements.body.style.fontSize = '';
        Utils.announceToScreenReader('Zoom reset to default');
    },

    toggleReduceMotion: function() {
        state.reduceMotion = !state.reduceMotion;
        elements.body.classList.toggle('reduce-motion', state.reduceMotion);
        Utils.updateButtonState(elements.skipAnimations, state.reduceMotion);

        const buttonLabel = elements.skipAnimations.querySelector('.toolbar-label');
        if (buttonLabel) {
            buttonLabel.textContent = state.reduceMotion ? 'No Motion' : 'Animations';
        }
        Utils.announceToScreenReader(state.reduceMotion ? 'Animations disabled' : 'Animations enabled');
    },

    toggleFocusMode: function() {
        state.focusMode = !state.focusMode;
        elements.body.classList.toggle('focus-mode', state.focusMode);
        Utils.updateButtonState(elements.focusMode, state.focusMode);
        Utils.announceToScreenReader(state.focusMode ? 'Focus mode enabled' : 'Focus mode disabled');
    },

    toggleReadingGuide: function() {
        state.readingGuide = !state.readingGuide;
        elements.body.classList.toggle('reading-guide-active', state.readingGuide);
        Utils.updateButtonState(elements.readingGuide, state.readingGuide);

        if (state.readingGuide) {
            this.setupReadingGuideTracking();
            Utils.announceToScreenReader('Reading guide enabled. Move your cursor over text to highlight lines');
        } else {
            this.removeReadingGuideTracking();
            if (state.lastHighlightedElement) {
                state.lastHighlightedElement.classList.remove('reading-guide-highlight');
                state.lastHighlightedElement = null;
            }
            Utils.announceToScreenReader('Reading guide disabled');
        }
    },

    setupReadingGuideTracking: function() {
        if (!state.readingGuide) return;
        document.addEventListener('mousemove', this.handleReadingGuideMouseMoveThrottled, { passive: true });
        document.addEventListener('mouseleave', this.handleReadingGuideMouseLeave, { passive: true });
    },

    removeReadingGuideTracking: function() {
        document.removeEventListener('mousemove', this.handleReadingGuideMouseMoveThrottled);
        document.removeEventListener('mouseleave', this.handleReadingGuideMouseLeave);

        if (state.readingGuideRafId) {
            cancelAnimationFrame(state.readingGuideRafId);
            state.readingGuideRafId = null;
        }

        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.display = 'none';
        }
    },

    handleReadingGuideMouseMoveThrottled: function(e) {
        if (!state.readingGuide) return;
        if (state.gestureMode && state.gestureStart) {
            return;
        }

        let lastMouseX = e.clientX;
        let lastMouseY = e.clientY;

        if (!state.pendingUpdate) {
            state.pendingUpdate = true;
            state.readingGuideRafId = requestAnimationFrame(() => {
                Accessibility.handleReadingGuideMouseMove(lastMouseX, lastMouseY);
                state.pendingUpdate = false;
            });
        }
    },

    handleReadingGuideMouseMove: function(clientX, clientY) {
        if (!state.readingGuide) return;

        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.left = `${clientX}px`;
            elements.readingGuideCursor.style.top = `${clientY}px`;
            elements.readingGuideCursor.style.display = 'block';
        }

        const now = Date.now();
        const throttleDelay = state.reduceMotion ? 100 : 50;

        if (!state.lastHighlightCheck || (now - state.lastHighlightCheck) > throttleDelay) {
            state.lastHighlightCheck = now;
            const elementAtPoint = document.elementFromPoint(clientX, clientY);
            if (!elementAtPoint) return;

            const textElement = this.findTextLineElement(elementAtPoint);

            if (textElement && textElement !== state.lastHighlightedElement) {
                if (state.lastHighlightedElement) {
                    state.lastHighlightedElement.classList.remove('reading-guide-highlight');
                }
                textElement.classList.add('reading-guide-highlight');
                state.lastHighlightedElement = textElement;
            }
        }
    },

    handleReadingGuideMouseLeave: function() {
        if (!state.readingGuide) return;
        if (state.lastHighlightedElement) {
            state.lastHighlightedElement.classList.remove('reading-guide-highlight');
            state.lastHighlightedElement = null;
        }
        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.display = 'none';
        }
    },

    findTextLineElement: function(element) {
        let current = element;

        // Skip UI elements that should never be highlighted
        if (current.closest('.bottom-interactions') ||
            current.closest('.accessibility-toolbar') ||
            current.closest('.modal') ||
            current.closest('.reading-analytics')) {
            return null;
        }

        // Skip structural elements in competency cards - only highlight actual text
        if (current.closest('.competency-grid') ||
            current.closest('.competency-card') ||
            current.classList.contains('competency-grid') ||
            current.classList.contains('competency-card') ||
            current.classList.contains('card-header') ||
            current.classList.contains('card-content')) {
            // Walk up/down to find actual text elements only
            while (current && current !== document.body) {
                const tagName = current.tagName?.toLowerCase();
                const hasText = current.textContent && current.textContent.trim().length > 0;

                // Only return actual text block elements (p, li, headings), not containers
                if (hasText && ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(current.tagName)) {
                    // Make sure it's not a container element
                    if (!current.classList.contains('card-content') &&
                        !current.classList.contains('card-header') &&
                        !current.classList.contains('competency-card') &&
                        !current.classList.contains('competency-grid')) {
                        return current;
                    }
                }

                // For inline elements within competency cards, find their text parent
                if ((tagName === 'span' || tagName === 'strong' || tagName === 'em' || tagName === 'a') &&
                    current.closest('.competency-card')) {
                    const textParent = current.closest('p, li, h1, h2, h3, h4, h5, h6');
                    if (textParent &&
                        !textParent.classList.contains('card-content') &&
                        !textParent.classList.contains('card-header')) {
                        return textParent;
                    }
                }

                current = current.parentElement;
            }
            return null;
        }

        // For non-card content, find text elements normally
        while (current && current !== document.body) {
            const tagName = current.tagName?.toLowerCase();
            const hasText = current.textContent && current.textContent.trim().length > 0;
            const isBlockElement = ['P', 'LI', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH'].includes(current.tagName);

            if (hasText && isBlockElement && current.closest('.section-content')) {
                // Skip container elements - only actual text blocks
                if (current.classList.contains('card-content') ||
                    current.classList.contains('card-header') ||
                    current.classList.contains('competency-card') ||
                    current.classList.contains('competency-grid')) {
                    current = current.parentElement;
                    continue;
                }

                // For inline elements, find their containing block element
                if (tagName === 'span' || tagName === 'strong' || tagName === 'em' || tagName === 'a') {
                    const parent = current.closest('p, li, div.section-content > *, h1, h2, h3, h4, h5, h6');
                    if (parent &&
                        !parent.classList.contains('card-content') &&
                        !parent.classList.contains('card-header') &&
                        !parent.classList.contains('competency-card') &&
                        !parent.classList.contains('competency-grid')) {
                        return parent;
                    }
                }

                // Only return if it's a real text block element, not a container
                if (['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(current.tagName) ||
                    (tagName === 'div' && current.closest('.section-content') && !current.closest('.competency-card'))) {
                    return current;
                }
            }
            current = current.parentElement;
        }
        return null;
    },

    setupReadingGuide: function() {
        if (state.readingGuide) {
            this.setupReadingGuideTracking();
        } else {
            this.removeReadingGuideTracking();
        }
    }
};