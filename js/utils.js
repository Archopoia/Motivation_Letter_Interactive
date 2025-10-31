// ========================================
// Utility Functions Module
// ========================================
import { state, elements } from './state.js';

export const Utils = {
    updateButtonState: function(button, isActive) {
        if (!button) return;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive);
    },

    announceToScreenReader: function(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        elements.body.appendChild(announcement);

        setTimeout(() => {
            if (elements.body.contains(announcement)) {
                elements.body.removeChild(announcement);
            }
        }, 1000);
    },


    savePreferences: function() {
        const preferences = {
            fontSize: state.fontSize,
            highContrast: state.highContrast,
            reduceMotion: state.reduceMotion,
            focusMode: state.focusMode,
            gestureMode: state.gestureMode,
            readingGuide: state.readingGuide
        };
        localStorage.setItem('uxDemoPreferences', JSON.stringify(preferences));
    },

    loadPreferences: function() {
        const saved = localStorage.getItem('uxDemoPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                Object.assign(state, preferences);

                // Apply preferences
                if (state.fontSize !== 1) {
                    document.documentElement.style.fontSize = `${state.baseFontSize * state.fontSize}px`;
                }
                if (state.highContrast) {
                    elements.body.classList.add('high-contrast');
                    this.updateButtonState(elements.contrastToggle, true);
                }
                if (state.reduceMotion) {
                    elements.body.classList.add('reduce-motion');
                    this.updateButtonState(elements.skipAnimations, true);
                    const buttonLabel = elements.skipAnimations.querySelector('.toolbar-label');
                    if (buttonLabel) {
                        buttonLabel.textContent = 'No Motion';
                    }
                }
                if (state.focusMode) {
                    elements.body.classList.add('focus-mode');
                    this.updateButtonState(elements.focusMode, true);
                }
                // Note: ReadingGuide, GestureMode toggles are handled in their respective modules' init
            } catch (e) {
                console.warn('Failed to load preferences:', e);
            }
        }
    },

    injectSrOnlyStyle: function() {
        if (!document.querySelector('style[data-sr-only]')) {
            const style = document.createElement('style');
            style.setAttribute('data-sr-only', 'true');
            style.textContent = `
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border-width: 0;
                }
            `;
            document.head.appendChild(style);
        }
    },

    setupModalCloseHandlers: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.hidden = true;
                    modal.style.display = 'none';
                }
            }
            if (e.target.classList.contains('modal') && e.target === e.currentTarget) {
                e.target.hidden = true;
                e.target.style.display = 'none';
            }
        });
    }
};

