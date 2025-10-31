// ========================================
// Main Entry Point - Initialize All Modules
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';
import { Accessibility } from './accessibility.js';
import { GestureControl } from './gesture.js';
import { Reading } from './reading.js';
import { Analytics } from './analytics.js';
import { Navigation } from './navigation.js';

// Initialize the application
function init() {
    // Inject screen reader only styles
    Utils.injectSrOnlyStyle();

    // Setup modal close handlers
    Utils.setupModalCloseHandlers();

    // Ensure modal is hidden on load
    if (elements.summaryModal) {
        elements.summaryModal.hidden = true;
        elements.summaryModal.style.display = 'none';
    }

    // Initialize all modules
    Accessibility.init();
    GestureControl.init();
    Reading.init();
    Analytics.init();
    Navigation.init();

    // Load saved preferences
    Utils.loadPreferences();

    // Setup mouse and scroll tracking for analytics
    document.addEventListener('mousemove', (e) => Analytics.handleMouseMove(e), { passive: true });
    document.addEventListener('click', (e) => Analytics.handleClick(e), { passive: true });
    window.addEventListener('scroll', () => Analytics.handleScroll(), { passive: true });

    // Announce demo to screen readers
    announceDemo();
}

function announceDemo() {
    setTimeout(() => {
        Utils.announceToScreenReader(
            'Interactive UX demonstration loaded. This letter demonstrates advanced accessibility features including gesture navigation. ' +
            'Press Alt+G for gestures. Hover over toolbar buttons to see keyboard shortcuts.'
        );
    }, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
