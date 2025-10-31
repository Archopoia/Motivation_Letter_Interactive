// ========================================
// Revolutionary UX Demonstration - Advanced JavaScript
// Lambda Health System Interactive Motivation Letter
// ========================================

(function() {
    'use strict';

    // ========================================
    // State Management
    // ========================================
    const state = {
        fontSize: 1,
        baseFontSize: 16,
        highContrast: false,
        reduceMotion: false,
        focusMode: false,
        immersiveMode: false,
        voiceControl: false,
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
        lastHighlightCheck: 0 // Timestamp of last highlight check
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        body: document.body,
        toolbar: document.getElementById('accessibility-toolbar'),
        contrastToggle: document.getElementById('contrast-toggle'),
        fontIncrease: document.getElementById('font-increase'),
        fontDecrease: document.getElementById('font-decrease'),
        fontReset: document.getElementById('font-reset'),
        skipAnimations: document.getElementById('skip-animations'),
        focusMode: document.getElementById('focus-mode'),
        readingGuide: document.getElementById('reading-guide'),
        voiceControl: document.getElementById('voice-control'),
        gestureMode: document.getElementById('gesture-mode'),
        immersiveMode: document.getElementById('immersive-mode'),
        scrollTop: document.getElementById('scroll-top'),
        readingProgress: document.querySelector('.progress-bar'),
        progressMarkers: document.querySelectorAll('.progress-marker'),
        sections: document.querySelectorAll('.content-section'),
        expandButtons: document.querySelectorAll('.inline-expand'),
        summaryModal: document.getElementById('summary-modal'),
        voiceIndicator: document.getElementById('voice-indicator'),
        readingGuideCursor: document.getElementById('reading-guide-cursor'),
        readingAnalytics: document.getElementById('reading-analytics'),
        analyticsBtn: document.getElementById('analytics-btn'),
        closeAnalytics: document.getElementById('close-analytics'),
        hintBtn: document.getElementById('hint-btn'),
        summaryBtn: document.getElementById('summary-btn'),
        gestureCanvas: document.getElementById('gesture-canvas'),
        readingTime: document.getElementById('reading-time'),
        sectionsVisited: document.getElementById('sections-visited'),
        engagementScore: document.getElementById('engagement-score')
    };

    // ========================================
    // Initialize
    // ========================================
    function init() {
        setupEventListeners();
        setupIntersectionObserver();
        setupScrollTracking();
        setupExpandableContent();
        setupVoiceRecognition();
        setupGestureRecognition();
        setupReadingGuide();
        setupReadingAnalytics();

        // Ensure modal is hidden on load
        if (elements.summaryModal) {
            elements.summaryModal.hidden = true;
            elements.summaryModal.style.display = 'none';
        }

        loadPreferences();
        startReadingTimer();
        announceDemo();

    }

    // ========================================
    // Event Listeners Setup
    // ========================================
    function setupEventListeners() {
        // Accessibility Controls
        if (elements.contrastToggle) {
            elements.contrastToggle.addEventListener('click', toggleHighContrast);
        }
        if (elements.fontIncrease) {
            elements.fontIncrease.addEventListener('click', () => adjustFontSize(state.fontScale));
        }
        if (elements.fontDecrease) {
            elements.fontDecrease.addEventListener('click', () => adjustFontSize(-state.fontScale));
        }
        if (elements.fontReset) {
            elements.fontReset.addEventListener('click', resetFontSize);
        }
        elements.skipAnimations.addEventListener('click', toggleReduceMotion);
        elements.focusMode.addEventListener('click', toggleFocusMode);
        elements.readingGuide.addEventListener('click', toggleReadingGuide);
        elements.voiceControl.addEventListener('click', toggleVoiceControl);
        elements.gestureMode.addEventListener('click', toggleGestureMode);
        elements.immersiveMode.addEventListener('click', toggleImmersiveMode);

        // Navigation
        elements.scrollTop.addEventListener('click', scrollToTop);
        elements.analyticsBtn.addEventListener('click', toggleAnalytics);
        elements.closeAnalytics.addEventListener('click', () => toggleAnalytics(false));
        elements.hintBtn.addEventListener('click', showInteractionHints);
        if (elements.summaryBtn) {
            elements.summaryBtn.addEventListener('click', generateSummary);
        }

        // Keyboard Navigation
        document.addEventListener('keydown', handleKeyboard);

        // Mouse tracking for smart features
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('click', handleClick, { passive: true });

        // Scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Save preferences
        const preferenceElements = [
            elements.contrastToggle, elements.fontIncrease, elements.fontDecrease,
            elements.fontReset, elements.skipAnimations, elements.focusMode,
            elements.readingGuide, elements.voiceControl, elements.gestureMode,
            elements.immersiveMode
        ];
        preferenceElements.forEach(el => el.addEventListener('click', savePreferences));
    }

    // ========================================
    // High Contrast Toggle
    // ========================================
    function toggleHighContrast() {
        state.highContrast = !state.highContrast;
        elements.body.classList.toggle('high-contrast', state.highContrast);
        updateButtonState(elements.contrastToggle, state.highContrast);
        announceToScreenReader(state.highContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
    }

    // ========================================
    // Font Size Adjustment
    // ========================================
    function adjustFontSize(change) {
        if (!elements.fontIncrease || !elements.fontDecrease) return;

        state.fontSize = Math.max(0.5, Math.min(2, state.fontSize + change));
        const newSize = state.baseFontSize * state.fontSize;
        document.documentElement.style.fontSize = `${newSize}px`;
        elements.body.style.fontSize = '';
        announceToScreenReader(`Font size: ${Math.round(state.fontSize * 100)}%`);
    }

    function resetFontSize() {
        if (!elements.fontReset) return;

        state.fontSize = 1;
        document.documentElement.style.fontSize = '';
        elements.body.style.fontSize = '';
        announceToScreenReader('Font size reset to default');
    }

    // ========================================
    // Reduce Motion Toggle
    // ========================================
    function toggleReduceMotion() {
        state.reduceMotion = !state.reduceMotion;
        elements.body.classList.toggle('reduce-motion', state.reduceMotion);
        updateButtonState(elements.skipAnimations, state.reduceMotion);

        // Update button label to reflect current state
        const buttonLabel = elements.skipAnimations.querySelector('.toolbar-label');
        if (buttonLabel) {
            buttonLabel.textContent = state.reduceMotion ? 'No Motion' : 'Animations';
        }

        announceToScreenReader(state.reduceMotion ? 'Animations disabled' : 'Animations enabled');
    }

    // ========================================
    // Focus Mode Toggle
    // ========================================
    function toggleFocusMode() {
        state.focusMode = !state.focusMode;
        elements.body.classList.toggle('focus-mode', state.focusMode);
        updateButtonState(elements.focusMode, state.focusMode);
        announceToScreenReader(state.focusMode ? 'Focus mode enabled' : 'Focus mode disabled');
    }

    // ========================================
    // Reading Guide Toggle
    // ========================================
    function toggleReadingGuide() {
        state.readingGuide = !state.readingGuide;
        elements.body.classList.toggle('reading-guide-active', state.readingGuide);
        updateButtonState(elements.readingGuide, state.readingGuide);

        if (state.readingGuide) {
            setupReadingGuideTracking();
            announceToScreenReader('Reading guide enabled. Move your cursor over text to highlight lines');
        } else {
            removeReadingGuideTracking();
            // Remove any remaining highlights
            if (state.lastHighlightedElement) {
                state.lastHighlightedElement.classList.remove('reading-guide-highlight');
                state.lastHighlightedElement = null;
            }
            announceToScreenReader('Reading guide disabled');
        }
    }

    function setupReadingGuideTracking() {
        if (!state.readingGuide) return;

        // Track mouse movement to update cursor position and highlight lines
        // Use throttled handler to prevent lag
        document.addEventListener('mousemove', handleReadingGuideMouseMoveThrottled, { passive: true });
        document.addEventListener('mouseleave', handleReadingGuideMouseLeave, { passive: true });
    }

    function removeReadingGuideTracking() {
        document.removeEventListener('mousemove', handleReadingGuideMouseMoveThrottled);
        document.removeEventListener('mouseleave', handleReadingGuideMouseLeave);

        // Cancel any pending animation frame
        if (state.readingGuideRafId) {
            cancelAnimationFrame(state.readingGuideRafId);
            state.readingGuideRafId = null;
        }

        // Hide cursor
        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.display = 'none';
        }
    }

    // Throttled mouse move handler using requestAnimationFrame
    let lastMouseX = 0;
    let lastMouseY = 0;
    let pendingUpdate = false;

    function handleReadingGuideMouseMoveThrottled(e) {
        if (!state.readingGuide) return;

        // Don't interfere with gesture mode
        if (state.gestureMode && state.gestureStart) {
            return;
        }

        // Store latest mouse position
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Schedule update via requestAnimationFrame (throttles to ~60fps max)
        if (!pendingUpdate) {
            pendingUpdate = true;
            state.readingGuideRafId = requestAnimationFrame(() => {
                handleReadingGuideMouseMove(lastMouseX, lastMouseY);
                pendingUpdate = false;
            });
        }
    }

    function handleReadingGuideMouseMove(clientX, clientY) {
        if (!state.readingGuide) return;

        // Update cursor position (lightweight operation)
        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.left = `${clientX}px`;
            elements.readingGuideCursor.style.top = `${clientY}px`;
            elements.readingGuideCursor.style.display = 'block';
        }

        // Throttle expensive DOM queries - only check highlights less frequently
        // When reduced motion is enabled, check even less frequently
        const now = Date.now();
        const throttleDelay = state.reduceMotion ? 100 : 50; // More throttling when reduced motion

        if (!state.lastHighlightCheck || (now - state.lastHighlightCheck) > throttleDelay) {
            state.lastHighlightCheck = now;

            // Find the text element at cursor position
            const elementAtPoint = document.elementFromPoint(clientX, clientY);
            if (!elementAtPoint) return;

            // Find the closest text-containing element (p, span, li, div with text, etc.)
            const textElement = findTextLineElement(elementAtPoint);

            if (textElement && textElement !== state.lastHighlightedElement) {
                // Remove previous highlight
                if (state.lastHighlightedElement) {
                    state.lastHighlightedElement.classList.remove('reading-guide-highlight');
                }

                // Apply new highlight
                textElement.classList.add('reading-guide-highlight');
                state.lastHighlightedElement = textElement;
            }
        }
    }

    function handleReadingGuideMouseLeave(e) {
        if (!state.readingGuide) return;

        // Remove highlight when mouse leaves the document
        if (state.lastHighlightedElement) {
            state.lastHighlightedElement.classList.remove('reading-guide-highlight');
            state.lastHighlightedElement = null;
        }

        // Hide cursor
        if (elements.readingGuideCursor) {
            elements.readingGuideCursor.style.display = 'none';
        }
    }

    function findTextLineElement(element) {
        // Walk up the DOM tree to find a suitable text element
        let current = element;

        // Skip if we're in the bottom toolbar or other UI elements
        if (current.closest('.bottom-interactions') ||
            current.closest('.accessibility-toolbar') ||
            current.closest('.modal') ||
            current.closest('.reading-analytics')) {
            return null;
        }

        // Try to find paragraph, list item, or div with text content
        while (current && current !== document.body) {
            const tagName = current.tagName?.toLowerCase();
            const hasText = current.textContent && current.textContent.trim().length > 0;
            const isBlockElement = ['P', 'LI', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH'].includes(current.tagName);

            // If it's a suitable element with text, return it
            if (hasText && isBlockElement && current.closest('.section-content')) {
                // For inline elements like span, try to get the parent paragraph
                if (tagName === 'span' || tagName === 'strong' || tagName === 'em' || tagName === 'a') {
                    const parent = current.closest('p, li, div.section-content > *, h1, h2, h3, h4, h5, h6');
                    if (parent) return parent;
                }
                return current;
            }

            current = current.parentElement;
        }

        return null;
    }

    function setupReadingGuide() {
        // Initialize reading guide state
        if (state.readingGuide) {
            setupReadingGuideTracking();
        } else {
            removeReadingGuideTracking();
        }
    }

    // ========================================
    // Voice Recognition
    // ========================================
    function setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            state.recognition = new SpeechRecognition();
            state.recognition.continuous = true;
            state.recognition.interimResults = false;
            state.recognition.lang = 'en-US';

            state.recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                handleVoiceCommand(command);
            };

            state.recognition.onerror = (event) => {
                // Only log errors that aren't network-related (offline mode)
                if (event.error !== 'network' && event.error !== 'no-speech') {
                    console.warn('Voice recognition error:', event.error);
                }
                // Handle network errors gracefully
                if (event.error === 'network') {
                    state.recognition.stop();
                    state.voiceControl = false;
                    elements.voiceIndicator.hidden = true;
                    updateButtonState(elements.voiceControl, false);
                    if (elements.voiceControl) {
                        announceToScreenReader('Voice recognition requires internet connection');
                    }
                }
                if (event.error === 'no-speech') {
                    // Silent - just continue listening
                }
            };
        } else {
            elements.voiceControl.disabled = true;
            elements.voiceControl.title = 'Voice recognition not supported in this browser';
        }
    }

    function toggleVoiceControl() {
        if (!state.recognition) {
            announceToScreenReader('Voice recognition not supported');
            return;
        }

        state.voiceControl = !state.voiceControl;
        updateButtonState(elements.voiceControl, state.voiceControl);
        elements.voiceIndicator.hidden = !state.voiceControl;

        if (state.voiceControl) {
            try {
                state.recognition.start();
                announceToScreenReader('Voice control enabled. Try saying: scroll down, scroll up, next section, read section');
            } catch (e) {
                console.warn('Recognition already started');
            }
        } else {
            state.recognition.stop();
            announceToScreenReader('Voice control disabled');
        }
    }

    function handleVoiceCommand(command) {
        const commands = {
            'scroll down': () => window.scrollBy({ top: 300, behavior: 'smooth' }),
            'scroll up': () => window.scrollBy({ top: -300, behavior: 'smooth' }),
            'next section': () => scrollToNextSection(),
            'previous section': () => scrollToPreviousSection(),
            'read section': () => readCurrentSection(),
            'increase font': () => adjustFontSize(state.fontScale),
            'decrease font': () => adjustFontSize(-state.fontScale),
            'high contrast': () => toggleHighContrast(),
            'focus mode': () => toggleFocusMode(),
            'stop': () => toggleVoiceControl()
        };

        for (const [key, action] of Object.entries(commands)) {
            if (command.includes(key)) {
                action();
                return;
            }
        }
    }

    // ========================================
    // Gesture Recognition
    // ========================================
    function setupGestureRecognition() {
        if (!elements.gestureCanvas) return;

        const canvas = elements.gestureCanvas;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    function toggleGestureMode() {
        state.gestureMode = !state.gestureMode;
        updateButtonState(elements.gestureMode, state.gestureMode);
        elements.gestureCanvas.hidden = !state.gestureMode;

        if (state.gestureMode) {
            setupGestureTracking();
            announceToScreenReader('Gesture mode enabled. Draw gestures with your mouse');
        } else {
            removeGestureTracking();
            announceToScreenReader('Gesture mode disabled');
        }
    }

    function setupGestureTracking() {
        state.gestureStart = null;
        state.mousePath = [];

        document.addEventListener('mousedown', startGesture);
        document.addEventListener('mousemove', trackGesture);
        document.addEventListener('mouseup', endGesture);
    }

    function removeGestureTracking() {
        document.removeEventListener('mousedown', startGesture);
        document.removeEventListener('mousemove', trackGesture);
        document.removeEventListener('mouseup', endGesture);

        const ctx = elements.gestureCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
        // Re-enable text selection when gesture mode is disabled
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }

    function startGesture(e) {
        if (!state.gestureMode) return;
        e.preventDefault(); // Prevent text selection
        state.gestureStart = { x: e.clientX, y: e.clientY, time: Date.now() };
        state.mousePath = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
        // Prevent text selection during gesture
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }

    function trackGesture(e) {
        if (!state.gestureMode || !state.gestureStart) return;
        e.preventDefault(); // Prevent text selection
        state.mousePath.push({ x: e.clientX, y: e.clientY, time: Date.now() });

        const ctx = elements.gestureCanvas.getContext('2d');
        const lastPoint = state.mousePath[state.mousePath.length - 2];
        const currentPoint = state.mousePath[state.mousePath.length - 1];

        ctx.strokeStyle = `rgba(59, 100, 170, ${Math.min(1, 200 / state.mousePath.length)})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (lastPoint) {
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
        }

        // Fade old strokes
        setTimeout(() => {
            ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
            redrawGesture();
        }, 100);
    }

    function redrawGesture() {
        if (!state.gestureStart || state.mousePath.length < 2) return;

        const ctx = elements.gestureCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);

        for (let i = 1; i < state.mousePath.length; i++) {
            const alpha = Math.min(1, (200 - (state.mousePath.length - i)) / state.mousePath.length);
            ctx.strokeStyle = `rgba(59, 100, 170, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(state.mousePath[i-1].x, state.mousePath[i-1].y);
            ctx.lineTo(state.mousePath[i].x, state.mousePath[i].y);
            ctx.stroke();
        }
    }

    function endGesture(e) {
        if (!state.gestureMode || !state.gestureStart || state.mousePath.length < 10) {
            state.gestureStart = null;
            state.mousePath = [];
            // Re-enable text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            return;
        }

        e.preventDefault(); // Prevent text selection
        const gesture = analyzeGesture(state.mousePath);
        executeGesture(gesture);

        // Clear after short delay
        setTimeout(() => {
            const ctx = elements.gestureCanvas.getContext('2d');
            ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
        }, 300);

        state.gestureStart = null;
        state.mousePath = [];
        // Re-enable text selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }

    function analyzeGesture(path) {
        if (path.length < 10) return null;

        const start = path[0];
        const end = path[path.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simple gesture recognition
        if (Math.abs(dy) > Math.abs(dx) * 2) {
            return dy > 0 ? 'down' : 'up';
        } else if (Math.abs(dx) > Math.abs(dy) * 2) {
            return dx > 0 ? 'right' : 'left';
        } else if (distance < 50) {
            return 'circle'; // Tap/click
        }

        return null;
    }

    function executeGesture(gesture) {
        const gestures = {
            'up': () => window.scrollBy({ top: -500, behavior: 'smooth' }),
            'down': () => window.scrollBy({ top: 500, behavior: 'smooth' }),
            'right': () => scrollToNextSection(),
            'left': () => scrollToPreviousSection(),
        };

        if (gestures[gesture]) {
            gestures[gesture]();
        }
    }


    // ========================================
    // Immersive Mode
    // ========================================
    function toggleImmersiveMode() {
        state.immersiveMode = !state.immersiveMode;
        elements.body.classList.toggle('immersive-mode', state.immersiveMode);
        updateButtonState(elements.immersiveMode, state.immersiveMode);
        announceToScreenReader(state.immersiveMode ? 'Immersive mode enabled' : 'Immersive mode disabled');
    }

    // ========================================
    // Reading Analytics
    // ========================================
    function setupReadingAnalytics() {
        // Track section visits
        elements.sections.forEach(section => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = section.id;
                        if (!state.sectionsVisited.has(sectionId)) {
                            state.sectionsVisited.add(sectionId);
                            updateAnalytics();
                        }
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(section);
        });
    }

    function startReadingTimer() {
        state.readingStartTime = Date.now();
        setInterval(updateReadingTime, 1000);
    }

    function updateReadingTime() {
        if (!state.readingStartTime) return;

        const elapsed = Math.floor((Date.now() - state.readingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        if (elements.readingTime) {
            elements.readingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Calculate engagement score
        const sectionsCount = state.sectionsVisited.size;
        const totalSections = elements.sections.length;
        const timeScore = Math.min(100, Math.floor(elapsed / 10)); // Time-based score
        const sectionsScore = Math.floor((sectionsCount / totalSections) * 100);
        state.engagementScore = Math.floor((timeScore + sectionsScore) / 2);

        if (elements.engagementScore) {
            elements.engagementScore.textContent = `${state.engagementScore}%`;
        }
    }

    function updateAnalytics() {
        if (elements.sectionsVisited) {
            elements.sectionsVisited.textContent = state.sectionsVisited.size;
        }
    }

    function toggleAnalytics(show) {
        state.analyticsVisible = show !== undefined ? show : !state.analyticsVisible;
        elements.readingAnalytics.hidden = !state.analyticsVisible;
        updateAnalytics();
    }

    function generateSummary() {
        const summaryContent = document.getElementById('summary-content');
        summaryContent.innerHTML = `
            <ul style="margin-top: 1rem; line-height: 1.8;">
                <li><strong>Position:</strong> Intern - UX Design Software Engineer at Lambda Health System</li>
                <li><strong>Unique Combination:</strong> UX/UI expertise + Software Development + Neuroscience background</li>
                <li><strong>Relevant Experience:</strong> Lead Game Designer, PsychoStratégie internship (serious games), Full Stack Development studies</li>
                <li><strong>Alignment:</strong> Passion for rehabilitation technology and improving patient outcomes</li>
                <li><strong>Technical Skills:</strong> HTML/CSS/JS, UX/UI Design, Agile Development, API Integration</li>
                <li><strong>Mission-Driven:</strong> Committed to meaningful work that directly impacts patients' lives</li>
            </ul>
        `;
        elements.summaryModal.hidden = false;
        elements.summaryModal.style.display = 'flex';
        const closeBtn = elements.summaryModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.focus();
        }
    }


    // ========================================
    // Mouse Tracking
    // ========================================
    function handleMouseMove(e) {
        state.lastMouseTime = Date.now();

        // Track mouse path for gesture recognition
        if (state.gestureMode && state.gestureStart) {
            // Already handled in gesture tracking
            return;
        }
    }

    function handleClick(e) {
        // Track engagement
        updateEngagementScore(5);
    }

    function handleScroll() {
        // Scroll handling for reading guide is now handled by mouse tracking
    }

    function updateEngagementScore(points) {
        state.engagementScore = Math.min(100, state.engagementScore + points);
        if (elements.engagementScore) {
            elements.engagementScore.textContent = `${state.engagementScore}%`;
        }
    }

    // ========================================
    // Intersection Observer for Animations
    // ========================================
    function setupIntersectionObserver() {
        if (state.reduceMotion) return;

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Mark section as visited
                    const sectionId = entry.target.id;
                    if (sectionId && !state.sectionsVisited.has(sectionId)) {
                        state.sectionsVisited.add(sectionId);
                        updateAnalytics();

                        // Update progress marker
                        const marker = document.querySelector(`.progress-marker[data-section="${sectionId}"]`);
                        if (marker) {
                            marker.classList.add('visited');
                        }
                    }
                }
            });
        }, options);

        elements.sections.forEach(section => {
            observer.observe(section);
        });
    }

    // ========================================
    // Reading Progress Tracking
    // ========================================
    function setupScrollTracking() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / scrollHeight) * 100;

            if (elements.readingProgress) {
                elements.readingProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                elements.readingProgress.setAttribute('aria-valuenow', Math.round(progress));
            }

            // Show/hide scroll to top button
            if (scrollTop > 300) {
                elements.scrollTop.style.opacity = '1';
                elements.scrollTop.style.visibility = 'visible';
            } else {
                elements.scrollTop.style.opacity = '0';
                elements.scrollTop.style.visibility = 'hidden';
            }
        }, { passive: true });
    }

    // ========================================
    // Expandable Content
    // ========================================
    function setupExpandableContent() {
        elements.expandButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-expand');
                const target = document.getElementById(`expand-${targetId}`);

                if (target) {
                    const isExpanded = this.getAttribute('aria-expanded') === 'true';

                    if (isExpanded) {
                        target.hidden = true;
                        this.setAttribute('aria-expanded', 'false');
                        announceToScreenReader('Content collapsed');
                    } else {
                        target.hidden = false;
                        this.setAttribute('aria-expanded', 'true');
                        announceToScreenReader('Content expanded');

                        // Smooth scroll to expanded content
                        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });

        // Setup section reader buttons (text-to-speech)
        document.querySelectorAll('.section-reader').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const section = this.closest('.content-section');
                if (section) {
                    toggleSectionReading(section, this);
                }
            });
        });
    }

    function toggleSectionReading(section, button) {
        if (!('speechSynthesis' in window)) {
            announceToScreenReader('Text-to-speech not supported in this browser');
            return;
        }

        const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);

        // Get or initialize reading state for this section
        if (!state.readingState[sectionId]) {
            state.readingState[sectionId] = { playing: false, paused: false, utterance: null, charIndex: 0, fullText: '' };
        }
        const readingState = state.readingState[sectionId];

        // Check button's visual state (most reliable indicator)
        // Also check the icon to be extra sure
        const icon = button.querySelector('span[aria-hidden="true"]');
        const iconText = icon ? icon.textContent.trim() : '';
        const buttonIsPlaying = button.classList.contains('reading-playing') || iconText === '⏸️';
        const buttonIsPaused = button.classList.contains('reading-paused') || iconText === '▶️';
        const buttonIsStopped = !buttonIsPlaying && !buttonIsPaused;

        // Check speech synthesis actual state
        const isCurrentlySpeaking = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        const isCurrentlyPaused = window.speechSynthesis.speaking && window.speechSynthesis.paused;

        // If another section is playing, pause and save it first
        // Check if speech is actually speaking and it's NOT this section that's speaking
        const isThisSectionPlaying = state.currentReadingSection === sectionId && isCurrentlySpeaking;
        const hasAnotherSectionPlaying = (state.currentReadingSection && state.currentReadingSection !== sectionId) ||
                                         (isCurrentlySpeaking && (!state.currentReadingSection || state.currentReadingSection !== sectionId));

        if (hasAnotherSectionPlaying && !isThisSectionPlaying) {
            const previousSectionId = state.currentReadingSection;

            // Find the previous section
            let previousSection = null;
            if (previousSectionId) {
                previousSection = document.getElementById(previousSectionId) ||
                    Array.from(document.querySelectorAll('.content-section')).find(s => {
                        const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                        return sId === previousSectionId;
                    });
            } else {
                // If no currentReadingSection but speech is speaking, find which section is playing
                document.querySelectorAll('.content-section').forEach(s => {
                    const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                    const sButton = s.querySelector('.section-reader');
                    if (sButton && sButton.classList.contains('reading-playing')) {
                        previousSection = s;
                        // Update currentReadingSection if it wasn't set
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
                    // CRITICAL: Disconnect the old utterance's event handlers to prevent interference
                    if (previousReadingState.utterance) {
                        previousReadingState.utterance.onboundary = null;
                        previousReadingState.utterance.onstart = null;
                        previousReadingState.utterance.onend = null;
                        previousReadingState.utterance.onpause = null;
                        previousReadingState.utterance.onresume = null;
                        previousReadingState.utterance.onerror = null;
                    }

                    // Save current position BEFORE pausing (more accurate)
                    if (previousReadingState.startTime) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }

                    // Pause the currently playing audio
                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    // Mark as paused and update button IMMEDIATELY (don't wait for pause to process)
                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    previousReadingState.utterance = null; // Clear the utterance reference to prevent interference
                    updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }

            // Now cancel to make room for new utterance, then handle the clicked section
            // Give a brief moment for pause to take effect before canceling
            setTimeout(() => {
                window.speechSynthesis.cancel();
                state.currentReadingSection = null;

                // Immediately preserve paused states after canceling
                preserveOtherSectionsPausedState();

                // Start aggressive preservation for the next 2 seconds
                startPausedStatePreserver();

                // Wait a moment for the cancel to process, then check if clicked section should show resume menu
                setTimeout(() => {
                    // Check if the clicked section is paused and has a saved position
                    const clickedReadingState = state.readingState[sectionId];
                    if (buttonIsPaused && clickedReadingState &&
                        clickedReadingState.charIndex > 0 &&
                        clickedReadingState.fullText &&
                        clickedReadingState.charIndex < clickedReadingState.fullText.length) {
                        // Show resume menu for the clicked section
                        showReadingResumeOptions(section, button, clickedReadingState);
                    } else {
                        // Start fresh or continue normally
                        preserveOtherSectionsPausedState();
                        startReadingSection(section, button, sectionId);
                    }
                }, 100);
            }, 100);
            return;
        }

        // Decision logic based on button's visual state
        if (buttonIsPlaying && (isCurrentlySpeaking || state.currentReadingSection === sectionId)) {
            // Currently playing - PAUSE it
            if (isCurrentlySpeaking) {
                window.speechSynthesis.pause();
            }
            readingState.paused = true;
            readingState.playing = false;
            // Save current position if possible
            if (readingState.startTime) {
                const timeElapsed = Date.now() - readingState.startTime;
                const estimatedCharsPerSecond = 150; // Average reading speed
                readingState.charIndex = Math.min(
                    readingState.fullText.length,
                    readingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                );
            }
            updateReadingButton(button, 'paused', section);
            state.readingState[sectionId] = readingState;
            announceToScreenReader('Reading paused');
            return;
        }

        if (buttonIsPaused) {
            // Button shows paused - check if we have a saved position to resume from
            // IMPORTANT: Use the state from state.readingState[sectionId] directly to avoid stale closures
            const currentReadingState = state.readingState[sectionId];

            if (currentReadingState &&
                currentReadingState.charIndex > 0 &&
                currentReadingState.fullText &&
                currentReadingState.charIndex < currentReadingState.fullText.length) {
                // We have a saved position - show restart/continue menu
                showReadingResumeOptions(section, button, currentReadingState);
            } else {
                // No saved position or position was corrupted - start fresh
                startReadingSection(section, button, sectionId);
            }
            return;
        }

        // Button shows stopped or no state - START reading
        // But first check if something else is playing and pause it
        if (isCurrentlySpeaking && state.currentReadingSection !== sectionId) {
            // Another section is playing - pause it first
            const previousSectionId = state.currentReadingSection;
            let previousSection = null;

            if (previousSectionId) {
                previousSection = document.getElementById(previousSectionId) ||
                    Array.from(document.querySelectorAll('.content-section')).find(s => {
                        const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                        return sId === previousSectionId;
                    });
            }

            // If not found, find by button state
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
                    // Pause the currently playing audio
                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    // Save current position
                    if (previousReadingState.startTime) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }
                    // Mark as paused
                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }

            // Cancel and wait before starting new section
            setTimeout(() => {
                window.speechSynthesis.cancel();
                state.currentReadingSection = null;
                setTimeout(() => {
                    startReadingSection(section, button, sectionId);
                }, 100);
            }, 50);
        } else {
            // No other section playing - start immediately
            startReadingSection(section, button, sectionId);
        }

        // Always update state
        state.readingState[sectionId] = readingState;
    }

    function startReadingSection(section, button, sectionId, startFromIndex = 0) {
        // Pause any ongoing speech (but preserve states of other sections)
        // Check if speech is actually speaking (even if currentReadingSection isn't set)
        const isSpeechPlaying = window.speechSynthesis.speaking && !window.speechSynthesis.paused;
        const hasAnotherSection = state.currentReadingSection && state.currentReadingSection !== sectionId;

        if (isSpeechPlaying && hasAnotherSection) {
            const previousSectionId = state.currentReadingSection;
            let previousSection = document.getElementById(previousSectionId) ||
                Array.from(document.querySelectorAll('.content-section')).find(s => {
                    const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
                    return sId === previousSectionId;
                });

            // If not found, try to find by button state
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
                    // Pause the currently playing audio first
                    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                        window.speechSynthesis.pause();
                    }

                    // Save current position before stopping
                    if (previousReadingState.startTime && window.speechSynthesis.speaking) {
                        const timeElapsed = Date.now() - previousReadingState.startTime;
                        const estimatedCharsPerSecond = 150;
                        previousReadingState.charIndex = Math.min(
                            previousReadingState.fullText.length,
                            previousReadingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                        );
                    }
                    // Mark as paused and update button
                    previousReadingState.playing = false;
                    previousReadingState.paused = true;
                    updateReadingButton(previousButton, 'paused', previousSection);
                    state.readingState[prevSectionId] = previousReadingState;
                }
            }
        }

        // Cancel any ongoing speech to make room for new utterance
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // Get text content from section
        const sectionText = section.querySelector('.section-content');
        if (!sectionText) return;

        let fullText = sectionText.innerText || sectionText.textContent;
        if (!fullText) return;

        // Get remaining text if resuming
        const textToRead = startFromIndex > 0 ? fullText.substring(startFromIndex) : fullText;

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Update or create reading state - preserve existing fullText if resuming
        const readingState = state.readingState[sectionId] || {
            playing: false,
            paused: false,
            utterance: null,
            charIndex: 0,
            fullText: '',
            startTime: null
        };

        // Always update fullText if we don't have one or if starting from beginning
        // If resuming (startFromIndex > 0), preserve existing fullText if it exists
        if (!readingState.fullText || startFromIndex === 0) {
            readingState.fullText = fullText;
        }

        // Update with new reading session
        readingState.playing = true;
        readingState.paused = false;
        readingState.utterance = utterance;
        // Only update charIndex if we're starting from a specific position
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
            updateReadingButton(button, 'playing', section);
            // Make sure we don't accidentally reset other paused sections
            setTimeout(() => {
                preserveOtherSectionsPausedState();
                startPausedStatePreserver();
            }, 0);
            announceToScreenReader('Reading section aloud');
        };

        utterance.onend = () => {
            readingState.playing = false;
            readingState.paused = false;
            // Don't clear charIndex and fullText - allow user to restart if desired
            // Only reset if they explicitly restart
            section.classList.remove('reading', 'reading-playing', 'reading-paused');
            updateReadingButton(button, 'stopped', section);
            state.readingState[sectionId] = readingState;
            if (state.currentReadingSection === sectionId) {
                state.currentReadingSection = null;
            }
            announceToScreenReader('Finished reading section');
        };

        utterance.onerror = (e) => {
            readingState.playing = false;
            readingState.paused = false;
            section.classList.remove('reading');
            updateReadingButton(button, 'stopped', section);
            announceToScreenReader('Error reading section');
        };

        // Track character position (approximate)
        utterance.onboundary = (e) => {
            // CRITICAL: Always check against the CURRENT state, not the closure
            // This prevents cross-contamination between sections
            const currentState = state.readingState[sectionId];
            if (currentState && currentState.utterance === utterance) {
                if (e.name === 'word' && e.charIndex !== undefined) {
                    // Track position relative to the start of the utterance
                    // e.charIndex is relative to the textToRead, so add startFromIndex
                    // Update the CURRENT state directly, not the closure variable
                    currentState.charIndex = Math.min(
                        currentState.fullText.length,
                        startFromIndex + e.charIndex
                    );
                    // Also update the closure variable for consistency
                    readingState.charIndex = currentState.charIndex;
                    // Update state immediately
                    state.readingState[sectionId] = currentState;
                }
            }
        };

        // Track pause events
        utterance.onpause = () => {
            readingState.paused = true;
            readingState.playing = false;
            // Save position when paused
            if (readingState.startTime) {
                const timeElapsed = Date.now() - readingState.startTime;
                const estimatedCharsPerSecond = 150;
                readingState.charIndex = Math.min(
                    readingState.fullText.length,
                    readingState.charIndex + Math.floor(timeElapsed / 1000 * estimatedCharsPerSecond)
                );
            }
            updateReadingButton(button, 'paused', section);
            state.readingState[sectionId] = readingState;
        };

        utterance.onresume = () => {
            readingState.paused = false;
            readingState.playing = true;
            readingState.startTime = Date.now(); // Reset timer for next pause
            updateReadingButton(button, 'playing', section);
            state.readingState[sectionId] = readingState;
        };

        state.readingState[sectionId] = readingState;
        state.currentReadingSection = sectionId;
        window.speechSynthesis.speak(utterance);
    }

    function stopAllReading() {
        window.speechSynthesis.cancel();
        state.currentReadingSection = null; // Clear current reading section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('reading', 'reading-playing', 'reading-paused');
            const button = section.querySelector('.section-reader');
            if (button) {
                const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
                const readingState = state.readingState[sectionId];
                if (readingState) {
                    readingState.playing = false;
                    // Keep paused state if we have a position to resume from
                    if (readingState.charIndex === 0) {
                        readingState.paused = false;
                        updateReadingButton(button, 'stopped', section);
                    } else {
                        readingState.paused = true;
                        updateReadingButton(button, 'paused', section);
                    }
                } else {
                    updateReadingButton(button, 'stopped', section);
                }
            }
        });
    }

    // Store interval ID for cleanup
    let pausedStatePreserverInterval = null;

    function preserveOtherSectionsPausedState() {
        // Ensure all paused sections remain paused
        document.querySelectorAll('.content-section').forEach(s => {
            const sId = s.id || 'section-' + Array.from(s.parentElement.children).indexOf(s);
            const sButton = s.querySelector('.section-reader');
            const sReadingState = state.readingState[sId];

            // If this section has a paused state with saved position, keep it paused
            if (sReadingState && sReadingState.paused && sReadingState.charIndex > 0 && sButton) {
                const buttonState = sButton.classList.contains('reading-paused') ? 'paused' :
                                   sButton.classList.contains('reading-playing') ? 'playing' : 'stopped';
                if (buttonState !== 'paused') {
                    updateReadingButton(sButton, 'paused', s);
                    // Also ensure the reading state is still marked as paused
                    sReadingState.paused = true;
                    sReadingState.playing = false;
                    state.readingState[sId] = sReadingState;
                }
            }
        });
    }

    function startPausedStatePreserver() {
        // Clear any existing interval
        if (pausedStatePreserverInterval) {
            clearInterval(pausedStatePreserverInterval);
        }
        // Check every 100ms for 2 seconds to ensure paused states stay
        let checks = 0;
        pausedStatePreserverInterval = setInterval(() => {
            preserveOtherSectionsPausedState();
            checks++;
            if (checks >= 20) { // 20 * 100ms = 2 seconds
                clearInterval(pausedStatePreserverInterval);
                pausedStatePreserverInterval = null;
            }
        }, 100);
    }

    function updateReadingButton(button, state, section) {
        const icon = button.querySelector('span[aria-hidden="true"]');
        if (!icon) return;

        // Remove existing state classes
        button.classList.remove('reading-playing', 'reading-paused', 'reading-stopped');
        if (section) {
            section.classList.remove('reading-playing', 'reading-paused');
        }

        switch(state) {
            case 'playing':
                icon.textContent = '⏸️';
                button.classList.add('reading-playing');
                if (section) {
                    section.classList.add('reading-playing');
                }
                button.setAttribute('aria-label', 'Pause reading');
                button.title = 'Click to pause reading';
                break;
            case 'paused':
                icon.textContent = '▶️';
                button.classList.add('reading-paused');
                if (section) {
                    section.classList.add('reading-paused');
                }
                button.setAttribute('aria-label', 'Resume reading or choose restart');
                button.title = 'Click to resume or restart reading';
                break;
            case 'stopped':
            default:
                icon.textContent = '🔊';
                button.classList.add('reading-stopped');
                button.setAttribute('aria-label', 'Read section aloud');
                button.title = 'Click to read section aloud';
                break;
        }
    }

    function showReadingResumeOptions(section, button, readingState) {
        // Remove any existing menu first
        const existingMenu = section.querySelector('.reading-resume-menu');
        if (existingMenu) {
            existingMenu.remove();
            return; // User clicked again to close menu
        }

        // Don't show menu if there's no saved position
        if (!readingState.charIndex || !readingState.fullText) {
            startReadingSection(section, button, section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section));
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'reading-resume-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'Reading options');
        menu.innerHTML = `
            <button class="resume-option restart" aria-label="Restart reading from beginning">
                <span aria-hidden="true">🔄</span> Restart from Beginning
            </button>
            <button class="resume-option continue" aria-label="Continue from where stopped">
                <span aria-hidden="true">▶️</span> Continue from Here
            </button>
        `;

        const sectionHeader = section.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.style.position = 'relative';
            sectionHeader.appendChild(menu);
        } else {
            // Fallback: append to section
            section.style.position = 'relative';
            section.appendChild(menu);
            menu.style.position = 'absolute';
            menu.style.top = '0';
            menu.style.right = '0';
        }

        // Position menu relative to button
        const buttonRect = button.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${buttonRect.bottom - sectionRect.top + 8}px`;
        menu.style.right = `${sectionRect.right - buttonRect.right}px`;
        menu.style.zIndex = '10000';

        // Add event listeners with stopPropagation to prevent bubbling
        menu.querySelector('.restart').addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
            // Reset reading state
            state.readingState[sectionId] = { playing: false, paused: false, utterance: null, charIndex: 0, fullText: '' };
            startReadingSection(section, button, sectionId, 0);
        });

        menu.querySelector('.continue').addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            const sectionId = section.id || 'section-' + Array.from(section.parentElement.children).indexOf(section);
            startReadingSection(section, button, sectionId, readingState.charIndex || 0);
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== button) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);

        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // ========================================
    // Navigation Helpers
    // ========================================
    function scrollToNextSection() {
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
    }

    function scrollToPreviousSection() {
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
            // Scroll to first section
            if (elements.sections.length > 0) {
                elements.sections[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    function readCurrentSection() {
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

    // Stop reading when page is hidden or user navigates away
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAllReading();
        }
    });

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        announceToScreenReader('Scrolled to top');
    }

    // ========================================
    // Keyboard Navigation
    // ========================================
    function handleKeyboard(e) {
        // Escape key
        if (e.key === 'Escape') {
            // Close reading resume menus first
            document.querySelectorAll('.reading-resume-menu').forEach(menu => menu.remove());

            // Stop all reading
            stopAllReading();

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
                    elements.contrastToggle.click();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    elements.fontIncrease.click();
                    break;
                case '-':
                    e.preventDefault();
                    elements.fontDecrease.click();
                    break;
                case '0':
                    e.preventDefault();
                    elements.fontReset.click();
                    break;
                case 'a':
                    e.preventDefault();
                    elements.skipAnimations.click();
                    break;
                case 'f':
                    e.preventDefault();
                    elements.focusMode.click();
                    break;
                case 'v':
                    e.preventDefault();
                    elements.voiceControl.click();
                    break;
                case 'g':
                    e.preventDefault();
                    elements.gestureMode.click();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    scrollToNextSection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    scrollToPreviousSection();
                    break;
                case 'm':
                    e.preventDefault();
                    generateSummary();
                    break;
            }
        }
    }

    // ========================================
    // Helper Functions
    // ========================================
    function updateButtonState(button, isActive) {
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive);
    }

    function showInteractionHints() {
        const hints = [
            '🎤 Voice Control: Say "scroll down", "next section", or "read section"',
            '👆 Gesture Mode: Draw gestures with your mouse (up/down/left/right)',
            '📖 Reading Guide: Highlights your reading line',
            '⌨️ Keyboard: Alt+Arrow keys to navigate, Alt+V for voice, Alt+G for gestures',
            '📝 Summary: Click Summary button or press Alt+M for key points',
            '📊 Analytics: Track your reading progress and engagement'
        ];

        setTimeout(() => {
            alert('Interaction Hints:\n\n' + hints.join('\n'));
        }, 100);
    }

    // ========================================
    // Screen Reader Announcements
    // ========================================
    function announceToScreenReader(message) {
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
    }

    // ========================================
    // Preferences Management
    // ========================================
    function savePreferences() {
        const preferences = {
            fontSize: state.fontSize,
            highContrast: state.highContrast,
            reduceMotion: state.reduceMotion,
            focusMode: state.focusMode,
            immersiveMode: state.immersiveMode,
            voiceControl: state.voiceControl,
            gestureMode: state.gestureMode,
            readingGuide: state.readingGuide
        };
        localStorage.setItem('uxDemoPreferences', JSON.stringify(preferences));
    }

    function loadPreferences() {
        const saved = localStorage.getItem('uxDemoPreferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                Object.assign(state, preferences);

                // Apply preferences
                if (state.fontSize !== 1) {
                    elements.body.style.fontSize = `${state.baseFontSize * state.fontSize}px`;
                }
                if (state.highContrast) {
                    elements.body.classList.add('high-contrast');
                    updateButtonState(elements.contrastToggle, true);
                }
                if (state.reduceMotion) {
                    elements.body.classList.add('reduce-motion');
                    updateButtonState(elements.skipAnimations, true);
                    const buttonLabel = elements.skipAnimations.querySelector('.toolbar-label');
                    if (buttonLabel) {
                        buttonLabel.textContent = 'No Motion';
                    }
                }
                if (state.focusMode) {
                    elements.body.classList.add('focus-mode');
                    updateButtonState(elements.focusMode, true);
                }
                if (state.immersiveMode) {
                    elements.body.classList.add('immersive-mode');
                    updateButtonState(elements.immersiveMode, true);
                }
                if (state.readingGuide) {
                    toggleReadingGuide();
                }
                if (state.voiceControl) {
                    toggleVoiceControl();
                }
                if (state.gestureMode) {
                    toggleGestureMode();
                }
            } catch (e) {
                console.warn('Failed to load preferences:', e);
            }
        }

    }

    // ========================================
    // Demo Announcement
    // ========================================
    function announceDemo() {
        setTimeout(() => {
            announceToScreenReader(
                'Interactive UX demonstration loaded. This letter demonstrates advanced accessibility features including voice control and gesture navigation. ' +
                'Press Alt+V for voice control, Alt+G for gestures, or click the Interaction Hints button for more information.'
            );
        }, 500);
    }

    // ========================================
    // Initialize on DOM Ready
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // Screen Reader Only Class
    // ========================================
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

    // Modal close handlers
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


})();
// Main application - migrated from script.js
