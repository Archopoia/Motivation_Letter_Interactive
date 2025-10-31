// ========================================
// State Management Module
// ========================================
export const state = {
    fontSize: 1,
    baseFontSize: 16,
    highContrast: false,
    reduceMotion: false,
    focusMode: false,
    gestureMode: false,
    readingGuide: false,
    fontScale: 0.1,
    readingStartTime: null,
    sectionsVisited: new Set(),
    engagementScore: 0,
    mousePath: [],
    lastMouseTime: Date.now(),
    recognition: null,
    gestureStart: null,
    readingGuidePosition: 0,
    lastHighlightedElement: null,
    analyticsVisible: false,
    readingState: {}, // Track reading state per section: { sectionId: { playing: bool, paused: bool, utterance: obj, charIndex: number, fullText: string } }
    currentReadingSection: null,
    readingGuideRafId: null, // Animation frame ID for reading guide throttling
    lastHighlightCheck: 0, // Timestamp of last highlight check
    pendingUpdate: false // For reading guide throttling
};

// Initialize DOM elements after DOM is ready
function initElements() {
    return {
        body: document.body,
        toolbar: document.getElementById('accessibility-toolbar'),
        contrastToggle: document.getElementById('contrast-toggle'),
        fontIncrease: document.getElementById('font-increase'),
        fontDecrease: document.getElementById('font-decrease'),
        fontReset: document.getElementById('font-reset'),
        skipAnimations: document.getElementById('skip-animations'),
        focusMode: document.getElementById('focus-mode'),
        readingGuide: document.getElementById('reading-guide'),
        gestureMode: document.getElementById('gesture-mode'),
        scrollTop: document.getElementById('scroll-top'),
        readingProgress: document.querySelector('.progress-bar'),
        progressMarkers: document.querySelectorAll('.progress-marker'),
        sections: document.querySelectorAll('.content-section'),
        expandButtons: document.querySelectorAll('.inline-expand'),
        summaryModal: document.getElementById('summary-modal'),
        readingGuideCursor: document.getElementById('reading-guide-cursor'),
        readingAnalytics: document.getElementById('reading-analytics'),
        closeAnalytics: document.getElementById('close-analytics'),
        gestureCanvas: document.getElementById('gesture-canvas'),
        readingTime: document.getElementById('reading-time'),
        sectionsVisited: document.getElementById('sections-visited'),
        engagementScore: document.getElementById('engagement-score')
    };
}

// Export elements getter that initializes on first access
let _elements = null;
export const elements = new Proxy({}, {
    get(target, prop) {
        if (!_elements) {
            _elements = initElements();
        }
        return _elements[prop];
    },
    set(target, prop, value) {
        if (!_elements) {
            _elements = initElements();
        }
        _elements[prop] = value;
        return true;
    },
    ownKeys(target) {
        if (!_elements) {
            _elements = initElements();
        }
        return Object.keys(_elements);
    }
});

// Also export a function to manually refresh elements
export function refreshElements() {
    _elements = initElements();
}