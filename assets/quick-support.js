(function () {

    // Bail early if the widget isn't on this page
    const widget = document.querySelector('[data-quick-support]');
    if (!widget) return;



    const launcher = widget.querySelector('[data-qs-launcher]');
    const panel = widget.querySelector('[data-qs-panel]');
    const closeBtn = widget.querySelector('[data-qs-close]');
    const categoryTitleEl = widget.querySelector('[data-qs-category-title]');
    const categoryListEl = widget.querySelector('[data-qs-category-list]');
    const answerQuestionEl = widget.querySelector('[data-qs-answer-question]');
    const answerCategoryEl = widget.querySelector('[data-qs-answer-category]');
    const answerBodyEl = widget.querySelector('[data-qs-answer-body]');
    const prevBtn = widget.querySelector('[data-qs-prev]');
    const nextBtn = widget.querySelector('[data-qs-next]');
    const prevLabelEl = widget.querySelector('[data-qs-prev-label]');
    const nextLabelEl = widget.querySelector('[data-qs-next-label]');
    const backToCatBtn = widget.querySelector('[data-qs-back-to-category]');
    const featuredListEl = widget.querySelector('[data-qs-featured-list]');
    const qsBody = widget.querySelector('.qs-body');

    const views = {
        home: widget.querySelector('[data-qs-view="home"]'),
        category: widget.querySelector('[data-qs-view="category"]'),
        answer: widget.querySelector('[data-qs-view="answer"]'),
    };


    const ICONS = {
        truck: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
        box: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
        refresh: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
        tag: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.25"/></svg>',
        shield: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/></svg>',
        globe: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z"/></svg>',
        phone: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>',
        info: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    };


    const categoryIconMap = {};
    const categoriesEl = widget.querySelector('[data-qs-categories]');
    if (categoriesEl) {
        try {
            JSON.parse(categoriesEl.textContent).forEach(c => {
                categoryIconMap[c.title] = c.icon;
            });
        } catch (err) {
            console.warn('[quick-support] could not parse category data', err);
        }
    }


    const questionsTemplate = widget.querySelector('[data-qs-questions]');
    const questions = questionsTemplate
        ? [...questionsTemplate.content.querySelectorAll('[data-qs-q-id]')].map(node => {
            try {
                const q = JSON.parse(node.textContent);
                // Resolve icon from the categoryIconMap built from the
                // data-qs-categories element Liquid renders into the DOM.
                q.icon = categoryIconMap[q.category] || 'info';
                return q;
            } catch {
                return null;
            }
        }).filter(Boolean)
        : [];

    // Pre-group by category so openCategory() is just an array lookup
    const byCategory = questions.reduce((acc, q) => {
        (acc[q.category] = acc[q.category] || []).push(q);
        return acc;
    }, {});

    // Expose data for the standalone featured-questions section.
    // The section's inline script listens for this event (or reads _qsData
    // if the deferred script has already run by the time the listener registers).
    window._qsData = { questions, icons: ICONS };
    window.dispatchEvent(new CustomEvent('qs:ready', { detail: { questions, icons: ICONS } }));

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    let lastFocus = null;
    let currentCategory = null;
    let currentQuestionIndex = -1;
    let answerOrigin = 'home';

    // Read merchant-configured copy from data attributes set by Liquid.
    const backLabel      = widget.dataset.qsBackLabel    || 'Back';
    const helpfulThanks  = widget.dataset.qsHelpfulThanks || 'Thanks for your feedback!';

    // View depth used to infer slide direction (forward vs back)
    const VIEW_ORDER = ['home', 'category', 'answer'];


    function openPanel() {
        lastFocus = document.activeElement;
        panel.hidden = false;

        requestAnimationFrame(() => widget.classList.add('is-open'));
        launcher.setAttribute('aria-expanded', 'true');
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('click', onOutsideClick, true);

        closeBtn?.focus();
    }

    function closePanel() {
        widget.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('click', onOutsideClick, true);
        // Wait for the closing transition before hiding and resetting
        setTimeout(() => {
            panel.hidden = true;
            showView('home');
            clearDeepLink();
        }, 280);
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    function showView(name, direction) {

        if (!direction) {
            const currentName = Object.keys(views).find(k => views[k] && !views[k].hidden);
            if (currentName) {
                const from = VIEW_ORDER.indexOf(currentName);
                const to = VIEW_ORDER.indexOf(name);
                direction = to > from ? 'forward' : 'back';
            }
        }

        if (qsBody && direction) {
            qsBody.dataset.qsDir = direction;
            clearTimeout(qsBody._dirTimer);
            qsBody._dirTimer = setTimeout(() => delete qsBody.dataset.qsDir, 320);
        }

        Object.entries(views).forEach(([key, el]) => {
            if (el) el.hidden = key !== name;
        });
    }


    function openCategory(title) {
        const list = byCategory[title] || [];
        currentCategory = title;
        categoryTitleEl.textContent = title;
        categoryListEl.innerHTML = list.map(q => `
            <li>
                <button type="button" class="qs-q"
                    data-qs-open-question="${q.id}"
                    data-qs-category="${escapeHtml(q.category)}">
                    <span class="qs-q__icon">${iconFor(q.icon)}</span>
                    <span class="qs-q__text">
                        <span class="qs-q__title">${escapeHtml(q.question)}</span>
                        <span class="qs-q__meta">${escapeHtml(q.category)}</span>
                    </span>
                </button>
            </li>
        `).join('');
        showView('category');
    }

    function openQuestion(id, categoryTitle, origin) {
        const category = categoryTitle || findCategoryFor(id);
        if (!category) return;

        const list = byCategory[category] || [];
        const index = list.findIndex(q => String(q.id) === String(id));
        if (index === -1) return;

        currentCategory = category;
        currentQuestionIndex = index;
        answerOrigin = origin || 'home';

        renderAnswer(list[index], category);
        updatePager(list);
        showView('answer');
        animateAnswerIn();
        setDeepLink(id);
    }

    function renderAnswer(q, category) {
        answerQuestionEl.textContent = q.question;
        answerCategoryEl.textContent = category;
        answerCategoryEl.dataset.qsOpenCategory = category;
        answerBodyEl.innerHTML = q.answer;
        updateBackLabel();
        resetHelpful();
    }

    function updateBackLabel() {
        if (!backToCatBtn) return;
        const label = answerOrigin === 'category' ? currentCategory : backLabel;
        backToCatBtn.setAttribute('aria-label', label);
    }

    function resetHelpful() {
        const wrap = widget.querySelector('[data-qs-helpful]');
        if (!wrap) return;
        const voteEl  = wrap.querySelector('[data-qs-helpful-vote]');
        const thanksEl = wrap.querySelector('[data-qs-helpful-thanks]');
        wrap.querySelectorAll('[data-qs-helpful-btn]').forEach(b => b.classList.remove('is-active'));
        if (voteEl)   { voteEl.hidden   = false; }
        if (thanksEl) { thanksEl.hidden = true;  }
    }

    function updatePager(list) {
        const prev = currentQuestionIndex > 0
            ? list[currentQuestionIndex - 1] : null;
        const next = currentQuestionIndex < list.length - 1
            ? list[currentQuestionIndex + 1] : null;

        prevBtn.hidden = !prev;
        nextBtn.hidden = !next;
        if (prev) prevLabelEl.textContent = prev.question;
        if (next) nextLabelEl.textContent = next.question;
    }

    function step(delta) {
        const list = byCategory[currentCategory] || [];
        const nextIndex = currentQuestionIndex + delta;
        if (nextIndex < 0 || nextIndex >= list.length) return;

        currentQuestionIndex = nextIndex;
        answerOrigin = 'category';

        renderAnswer(list[nextIndex], currentCategory);
        updatePager(list);
        animateAnswerIn();
        setDeepLink(list[nextIndex].id);
    }

    function animateAnswerIn() {
        const el = views.answer;
        if (!el) return;
        el.classList.remove('is-entering');
        void el.offsetWidth;
        el.classList.add('is-entering');
    }


    function findCategoryFor(id) {
        const match = questions.find(q => String(q.id) === String(id));
        return match ? match.category : null;
    }

    function iconFor(name) {
        return ICONS[name] || ICONS.info;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    // -------------------------------------------------------------------------
    // Deep linking  (?faq=<block-id>)
    // -------------------------------------------------------------------------

    function getDeepLink() {
        return new URLSearchParams(window.location.search).get('faq');
    }

    function setDeepLink(id) {
        const url = new URL(window.location.href);
        url.searchParams.set('faq', id);
        window.history.replaceState({}, '', url);
    }

    function clearDeepLink() {
        const url = new URL(window.location.href);
        url.searchParams.delete('faq');
        window.history.replaceState({}, '', url);
    }

    launcher.addEventListener('click', () => {
        widget.classList.contains('is-open') ? closePanel() : openPanel();
    });

    closeBtn?.addEventListener('click', closePanel);

    // Listen for open requests from the standalone featured-questions section.
    document.addEventListener('qs:open-question', e => {
        const { id, category } = e.detail || {};
        if (!id) return;
        if (!widget.classList.contains('is-open')) openPanel();
        // Small delay so the panel finishes its open transition before navigating.
        setTimeout(() => openQuestion(id, category, 'home'), 60);
    });

    // Single delegated listener on the widget covers all dynamic content
    widget.addEventListener('click', e => {

        const catBtn = e.target.closest('[data-qs-open-category]');
        if (catBtn) { openCategory(catBtn.dataset.qsOpenCategory); return; }

        const qBtn = e.target.closest('[data-qs-open-question]');
        if (qBtn) {
            const fromHome = !!qBtn.closest('[data-qs-view="home"]');
            openQuestion(
                qBtn.dataset.qsOpenQuestion,
                qBtn.dataset.qsCategory,
                fromHome ? 'home' : 'category'
            );
            return;
        }

        if (e.target.closest('[data-qs-back]')) {
            showView('home', 'back');
            return;
        }

        if (e.target.closest('[data-qs-back-to-category]')) {
            answerOrigin === 'category'
                ? openCategory(currentCategory)
                : showView('home', 'back');
            return;
        }

        if (e.target.closest('[data-qs-prev]')) { step(-1); return; }
        if (e.target.closest('[data-qs-next]')) { step(1); return; }

        const helpfulBtn = e.target.closest('[data-qs-helpful-btn]');
        if (helpfulBtn) {
            const wrap     = helpfulBtn.closest('[data-qs-helpful]');
            const voteEl   = wrap?.querySelector('[data-qs-helpful-vote]');
            const thanksEl = wrap?.querySelector('[data-qs-helpful-thanks]');
            // Mark active state immediately for tactile feedback
            wrap?.querySelectorAll('[data-qs-helpful-btn]').forEach(b => b.classList.remove('is-active'));
            helpfulBtn.classList.add('is-active');
            // Swap to thank-you message after a short pause
            setTimeout(() => {
                if (voteEl)   { voteEl.hidden = true; }
                if (thanksEl) {
                    thanksEl.textContent = helpfulThanks;
                    thanksEl.hidden = false;
                }
            }, 420);
            return;
        }
    });

    function onKeydown(e) {
        if (e.key === 'Escape') { closePanel(); return; }
        if (e.key === 'Tab') trapFocus(e);
    }

    function trapFocus(e) {
        const all = panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
        const visible = [...all].filter(el => !el.hidden && el.offsetParent !== null);
        if (!visible.length) return;

        const first = visible[0];
        const last = visible[visible.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            last.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus(); e.preventDefault();
        }
    }

    function onOutsideClick(e) {
        if (!widget.contains(e.target)) closePanel();
    }



    if (featuredListEl) {
        const featured = questions.filter(q => q.featured);
        featuredListEl.innerHTML = featured.map(q => `
            <li>
                <button type="button" class="qs-q"
                    data-qs-open-question="${q.id}"
                    data-qs-category="${escapeHtml(q.category)}">
                    <span class="qs-q__icon">${iconFor(q.icon)}</span>
                    <span class="qs-q__text">
                        <span class="qs-q__title">${escapeHtml(q.question)}</span>
                        <span class="qs-q__meta">${escapeHtml(q.category)}</span>
                    </span>
                </button>
            </li>
        `).join('');
    }


    const initialId = getDeepLink();
    if (initialId) {
        openPanel();
        openQuestion(initialId, null, 'home');
    }

})();