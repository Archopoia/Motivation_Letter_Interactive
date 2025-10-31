// ========================================
// Gesture Recognition Module
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';
import { Navigation } from './navigation.js';

export const GestureControl = {
    init: function() {
        if (!elements.gestureCanvas) return;

        const canvas = elements.gestureCanvas;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        if (elements.gestureMode) {
            elements.gestureMode.addEventListener('click', () => {
                this.toggle();
                Utils.savePreferences();
            });
        }

        // Initial setup for gesture mode
        if (state.gestureMode) {
            this.toggle();
        }
    },

    toggle: function() {
        state.gestureMode = !state.gestureMode;
        Utils.updateButtonState(elements.gestureMode, state.gestureMode);
        elements.gestureCanvas.hidden = !state.gestureMode;

        if (state.gestureMode) {
            this.setupTracking();
            Utils.announceToScreenReader('Gesture mode enabled. Draw gestures with your mouse');
        } else {
            this.removeTracking();
            Utils.announceToScreenReader('Gesture mode disabled');
        }
    },

    setupTracking: function() {
        state.gestureStart = null;
        state.mousePath = [];

        document.addEventListener('mousedown', this.startGesture);
        document.addEventListener('mousemove', this.trackGesture);
        document.addEventListener('mouseup', this.endGesture);
    },

    removeTracking: function() {
        document.removeEventListener('mousedown', this.startGesture);
        document.removeEventListener('mousemove', this.trackGesture);
        document.removeEventListener('mouseup', this.endGesture);

        const ctx = elements.gestureCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    },

    startGesture: function(e) {
        if (!state.gestureMode) return;
        e.preventDefault();
        state.gestureStart = { x: e.clientX, y: e.clientY, time: Date.now() };
        state.mousePath = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    },

    trackGesture: function(e) {
        if (!state.gestureMode || !state.gestureStart) return;
        e.preventDefault();
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

        setTimeout(() => {
            ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
            GestureControl.redrawGesture();
        }, 100);
    },

    redrawGesture: function() {
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
    },

    endGesture: function(e) {
        if (!state.gestureMode || !state.gestureStart || state.mousePath.length < 10) {
            state.gestureStart = null;
            state.mousePath = [];
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            return;
        }

        e.preventDefault();
        const gesture = GestureControl.analyzeGesture(state.mousePath);
        GestureControl.executeGesture(gesture);

        setTimeout(() => {
            const ctx = elements.gestureCanvas.getContext('2d');
            ctx.clearRect(0, 0, elements.gestureCanvas.width, elements.gestureCanvas.height);
        }, 300);

        state.gestureStart = null;
        state.mousePath = [];
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    },

    analyzeGesture: function(path) {
        if (path.length < 10) return null;

        const start = path[0];
        const end = path[path.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (Math.abs(dy) > Math.abs(dx) * 2) {
            return dy > 0 ? 'down' : 'up';
        } else if (Math.abs(dx) > Math.abs(dy) * 2) {
            return dx > 0 ? 'right' : 'left';
        } else if (distance < 50) {
            return 'circle';
        }
        return null;
    },

    executeGesture: function(gesture) {
        const gestures = {
            'up': () => window.scrollBy({ top: -500, behavior: 'smooth' }),
            'down': () => window.scrollBy({ top: 500, behavior: 'smooth' }),
            'right': () => Navigation.scrollToNextSection(),
            'left': () => Navigation.scrollToPreviousSection(),
        };

        if (gestures[gesture]) {
            gestures[gesture]();
        }
    }
};