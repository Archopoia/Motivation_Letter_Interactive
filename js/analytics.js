// ========================================
// Analytics Module - Reading Analytics and Tracking
// ========================================
import { state, elements } from './state.js';
import { Utils } from './utils.js';

export const Analytics = {
    init: function() {
        this.setupReadingAnalytics();
        this.startReadingTimer();
        this.setupIntersectionObserver();
        this.setupScrollTracking();

        // Setup analytics button handlers
        if (elements.closeAnalytics) {
            elements.closeAnalytics.addEventListener('click', () => this.toggle(false));
        }
    },

    setupReadingAnalytics: function() {
        elements.sections.forEach(section => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionId = section.id;
                        if (!state.sectionsVisited.has(sectionId)) {
                            state.sectionsVisited.add(sectionId);
                            this.updateAnalytics();
                        }
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(section);
        });
    },

    startReadingTimer: function() {
        state.readingStartTime = Date.now();
        setInterval(() => this.updateReadingTime(), 1000);
    },

    updateReadingTime: function() {
        if (!state.readingStartTime) return;

        const elapsed = Math.floor((Date.now() - state.readingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        if (elements.readingTime) {
            elements.readingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        const sectionsCount = state.sectionsVisited.size;
        const totalSections = elements.sections.length;
        const timeScore = Math.min(100, Math.floor(elapsed / 10));
        const sectionsScore = Math.floor((sectionsCount / totalSections) * 100);
        state.engagementScore = Math.floor((timeScore + sectionsScore) / 2);

        if (elements.engagementScore) {
            elements.engagementScore.textContent = `${state.engagementScore}%`;
        }
    },

    updateAnalytics: function() {
        if (elements.sectionsVisited) {
            elements.sectionsVisited.textContent = state.sectionsVisited.size;
        }
    },

    toggle: function(show) {
        state.analyticsVisible = show !== undefined ? show : !state.analyticsVisible;
        elements.readingAnalytics.hidden = !state.analyticsVisible;
        this.updateAnalytics();
    },

    generateSummary: function() {
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
    },

    handleMouseMove: function(e) {
        state.lastMouseTime = Date.now();
        if (state.gestureMode && state.gestureStart) {
            return;
        }
    },

    handleClick: function(e) {
        this.updateEngagementScore(5);
    },

    handleScroll: function() {
        // Scroll handling for reading guide is now handled by mouse tracking
    },

    updateEngagementScore: function(points) {
        state.engagementScore = Math.min(100, state.engagementScore + points);
        if (elements.engagementScore) {
            elements.engagementScore.textContent = `${state.engagementScore}%`;
        }
    },

    setupIntersectionObserver: function() {
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

                    const sectionId = entry.target.id;
                    if (sectionId && !state.sectionsVisited.has(sectionId)) {
                        state.sectionsVisited.add(sectionId);
                        this.updateAnalytics();

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
    },

    setupScrollTracking: function() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / scrollHeight) * 100;

            if (elements.readingProgress) {
                elements.readingProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                elements.readingProgress.setAttribute('aria-valuenow', Math.round(progress));
            }

            if (scrollTop > 300) {
                elements.scrollTop.style.opacity = '1';
                elements.scrollTop.style.visibility = 'visible';
            } else {
                elements.scrollTop.style.opacity = '0';
                elements.scrollTop.style.visibility = 'hidden';
            }
        }, { passive: true });
    }
};
