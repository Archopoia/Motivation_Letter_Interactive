// ========================================
// Navigation Module - Document Navigation Helpers
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';
import { Reading } from './reading.js';
import { Analytics } from './analytics.js';

export const Navigation = {
    init: function() {
        // Setup scroll to top button
        if (elements.scrollTop) {
            elements.scrollTop.addEventListener('click', () => this.scrollToTop());
        }

        // Setup keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    },

    scrollToNextSection: function() {
        const currentScroll = window.scrollY;
        let nextSection = null;
        let minDistance = Infinity;

        elements.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top > 100) {
                const distance = rect.top;
                if (distance < minDistance) {
                    minDistance = distance;
                    nextSection = section;
                }
            }
        });

        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    scrollToPreviousSection: function() {
        const currentScroll = window.scrollY;
        let prevSection = null;
        let maxTop = -Infinity;

        elements.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < -50) {
                if (rect.top > maxTop) {
                    maxTop = rect.top;
                    prevSection = section;
                }
            }
        });

        if (prevSection) {
            prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            if (elements.sections.length > 0) {
                elements.sections[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    scrollToTop: function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        Utils.announceToScreenReader('Scrolled to top');
    },

    handleKeyboard: function(e) {
        // Escape key
        if (e.key === 'Escape') {
            // Close reading resume menus first
            document.querySelectorAll('.reading-resume-menu').forEach(menu => menu.remove());

            // Stop all reading
            Reading.stopAllReading();

            // Close modals
            if (elements.summaryModal && !elements.summaryModal.hidden) {
                elements.summaryModal.hidden = true;
                elements.summaryModal.style.display = 'none';
                return;
            }

            // Close expanded content
            elements.expandButtons.forEach(button => {
                if (button.getAttribute('aria-expanded') === 'true') {
                    const targetId = button.getAttribute('data-expand');
                    const target = document.getElementById(`expand-${targetId}`);
                    if (target) {
                        target.hidden = true;
                        button.setAttribute('aria-expanded', 'false');
                        button.focus();
                    }
                }
            });
        }

        // Keyboard shortcuts
        if (e.altKey) {
            switch(e.key) {
                case 'c':
                    e.preventDefault();
                    if (elements.contrastToggle) {
                        elements.contrastToggle.click();
                    }
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    if (elements.fontIncrease) {
                        elements.fontIncrease.click();
                    }
                    break;
                case '-':
                    e.preventDefault();
                    if (elements.fontDecrease) {
                        elements.fontDecrease.click();
                    }
                    break;
                case '0':
                    e.preventDefault();
                    if (elements.fontReset) {
                        elements.fontReset.click();
                    }
                    break;
                case 'a':
                    e.preventDefault();
                    if (elements.skipAnimations) {
                        elements.skipAnimations.click();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    if (elements.focusMode) {
                        elements.focusMode.click();
                    }
                    break;
                case 'g':
                    e.preventDefault();
                    if (elements.gestureMode) {
                        elements.gestureMode.click();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.scrollToNextSection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.scrollToPreviousSection();
                    break;
            }
        }
    }
};
