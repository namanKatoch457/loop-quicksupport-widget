(function () {
    const widget = document.querySelector('[data-quick-support]');
    if (!widget) return;

    const launcher = widget.querySelector('[data-qs-launcher]');
    const panel = widget.querySelector('[data-qs-panel]');
    const closeBtn = widget.querySelector('[data-qs-close]');

    const views = {
        home: widget.querySelector('[data-qs-view="home"]'),
        category: widget.querySelector('[data-qs-view="category"]'),
        answer: widget.querySelector('[data-qs-view="answer"]'),
    };

    const categoryTitleEl = widget.querySelector('[data-qs-category-title]');
    const categoryListEl = widget.querySelector('[data-qs-category-list]');
    const answerQuestionEl = widget.querySelector('[data-qs-answer-question]');
    const answerCategoryEl = widget.querySelector('[data-qs-answer-category]');
    const answerBodyEl = widget.querySelector('[data-qs-answer-body]');
    const prevBtn = widget.querySelector('[data-qs-prev]');
    const nextBtn = widget.querySelector('[data-qs-next]');
    const prevLabelEl = widget.querySelector('[data-qs-prev-label]');
    const nextLabelEl = widget.querySelector('[data-qs-next-label]');
    const backToCategoryBtn = widget.querySelector('[data-qs-back-to-category]');

    // Icon markup used when rendering questions dynamically (category list view).
    // Mirrors the icons defined in snippets/qs-icon.liquid.
    const ICONS = {
        truck: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
        box: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
        refresh: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
        info: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        globe: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z"/></svg>',
        phone: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>',
        tag: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.25"/></svg>',
        shield: '<svg class="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/></svg>',
    };

    // Build category title → icon map from the inline JSON (rendered directly into the DOM,
    // not inside a <template>), so Liquid's simple for-loop always resolves settings correctly.
    const categoryIconMap = {};
    const categoriesEl = widget.querySelector('[data-qs-categories]');
    if (categoriesEl) {
        try {
            JSON.parse(categoriesEl.textContent).forEach(c => {
                categoryIconMap[c.title] = c.icon;
            });
        } catch {}
    }

    // Read all question data from the inline JSON scripts.
    // These live inside a <template>, so we must read them via .content —
    // querying the widget directly can't see into a template's contents.
    const questionsTemplate = widget.querySelector('[data-qs-questions]');
    const questions = questionsTemplate
        ? [...questionsTemplate.content.querySelectorAll('[data-qs-q-id]')].map((node) => {
            try {
                const q = JSON.parse(node.textContent);
                // Resolve icon from the category map (bypasses Liquid `where` scoping bug)
                q.icon = categoryIconMap[q.category] || 'info';
                return q;
            } catch { return null; }
        }).filter(Boolean)
        : [];

    // Group by category title for fast lookup
    const questionsByCategory = questions.reduce((acc, q) => {
        (acc[q.category] = acc[q.category] || []).push(q);
        return acc;
    }, {});

    let lastFocus = null;
    let currentCategory = null;
    let currentQuestionIndex = -1;
    let answerOrigin = 'home';

    function openPanel() {
        lastFocus = document.activeElement;
        panel.hidden = false;
        requestAnimationFrame(() => widget.classList.add('is-open'));
        launcher.setAttribute('aria-expanded', 'true');
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('click', onOutsideClick, true);
        // Focus the close button, not the first focusable element — the
        // contact-strip buttons show a tooltip on focus (for keyboard
        // accessibility), so auto-focusing one of those made its tooltip
        // appear "stuck open" every time the panel opened.
        closeBtn?.focus();
    }

    function closePanel() {
        widget.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('click', onOutsideClick, true);
        setTimeout(() => {
            panel.hidden = true;
            showView('home');
            clearDeepLink();
        }, 280);
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    function showView(name) {
        Object.entries(views).forEach(([key, el]) => {
            if (!el) return;
            el.hidden = key !== name;
        });
    }

    function openCategory(title) {
        const list = questionsByCategory[title] || [];
        currentCategory = title;
        categoryTitleEl.textContent = title;
        categoryListEl.innerHTML = list.map((q, i) => `
      <li>
        <button type="button" class="qs-q" data-qs-open-question="${q.id}" data-qs-question-index="${i}">
          <span class="qs-q__icon">${iconFor(q.icon)}</span>
          <span class="qs-q__text">
            <span class="qs-q__title">${escapeHtml(q.question)}</span>
          </span>
        </button>
      </li>
    `).join('');
        showView('category');
    }

    function openQuestion(id, categoryTitle, origin) {
        const category = categoryTitle || findCategoryForQuestion(id);
        if (!category) return;
        const list = questionsByCategory[category] || [];
        const index = list.findIndex((q) => String(q.id) === String(id));
        if (index === -1) return;

        currentCategory = category;
        currentQuestionIndex = index;
        answerOrigin = origin || 'home';
        renderAnswer(list[index], category);
        updatePager(list);
        showView('answer');
        setDeepLink(id);
    }

    function renderAnswer(q, category) {
        answerQuestionEl.textContent = q.question;
        answerCategoryEl.textContent = category; // always shows the real category name now
        answerCategoryEl.dataset.qsOpenCategory = category; // clicking the label jumps straight to that topic's list
        answerBodyEl.innerHTML = q.answer;
        updateBackLabel();
    }

    function updateBackLabel() {
        // The back button is icon-only now, so this just sets its accessible
        // name: the category name if we came from a category list, or the
        // generic "Back" label if we came from Home / a deep link.
        if (!backToCategoryBtn) return;
        const label = answerOrigin === 'category'
            ? currentCategory
            : (panel.dataset.qsBackLabel || 'Back');
        backToCategoryBtn.setAttribute('aria-label', label);
    }

    function updatePager(list) {
        const prevQ = currentQuestionIndex > 0 ? list[currentQuestionIndex - 1] : null;
        const nextQ = currentQuestionIndex < list.length - 1 ? list[currentQuestionIndex + 1] : null;

        prevBtn.hidden = !prevQ;
        if (prevQ) prevLabelEl.textContent = prevQ.question;

        nextBtn.hidden = !nextQ;
        if (nextQ) nextLabelEl.textContent = nextQ.question;
    }

    function step(delta) {
        const list = questionsByCategory[currentCategory] || [];
        const nextIndex = currentQuestionIndex + delta;
        if (nextIndex < 0 || nextIndex >= list.length) return;
        currentQuestionIndex = nextIndex;
        answerOrigin = 'category'; // paging forward/back means you're now browsing this category
        renderAnswer(list[nextIndex], currentCategory);
        updatePager(list);
        setDeepLink(list[nextIndex].id);
    }

    function findCategoryForQuestion(id) {
        const match = questions.find((q) => String(q.id) === String(id));
        return match ? match.category : null;
    }

    function iconFor(name) {
        return ICONS[name] || ICONS.info;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // Deep link handling

    function getDeepLink() {
        const params = new URLSearchParams(window.location.search);
        return params.get('faq');
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

    // Event wiring

    launcher.addEventListener('click', () => {
        widget.classList.contains('is-open') ? closePanel() : openPanel();
    });

    closeBtn?.addEventListener('click', closePanel);

    widget.addEventListener('click', (e) => {
        const catBtn = e.target.closest('[data-qs-open-category]');
        if (catBtn) {
            openCategory(catBtn.dataset.qsOpenCategory);
            return;
        }

        const qBtn = e.target.closest('[data-qs-open-question]');
        if (qBtn) {
            const fromHome = !!qBtn.closest('[data-qs-view="home"]');
            openQuestion(qBtn.dataset.qsOpenQuestion, qBtn.dataset.qsCategory, fromHome ? 'home' : 'category');
            return;
        }

        if (e.target.closest('[data-qs-back]')) {
            showView('home');
            return;
        }

        if (e.target.closest('[data-qs-back-to-category]')) {
            if (answerOrigin === 'category') {
                openCategory(currentCategory);
            } else {
                showView('home');
            }
            return;
        }

        if (e.target.closest('[data-qs-prev]')) step(-1);
        if (e.target.closest('[data-qs-next]')) step(1);
    });

    function onKeydown(e) {
        if (e.key === 'Escape') {
            closePanel();
            return;
        }
        if (e.key === 'Tab') trapFocus(e);
    }

    function trapFocus(e) {
        const focusables = panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
        const visible = [...focusables].filter((el) => !el.hidden && el.offsetParent !== null);
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

    // Render featured questions from JSON data (fixes Liquid icon scoping issue)
    const featuredListEl = widget.querySelector('[data-qs-featured-list]');
    if (featuredListEl) {
        featuredListEl.innerHTML = questions
            .filter(q => q.featured)
            .map(q => `
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
    // Auto-open from deep link
    const initialId = getDeepLink();

    if (initialId) {
        openPanel();
        openQuestion(initialId, null, 'home');
    }
})();