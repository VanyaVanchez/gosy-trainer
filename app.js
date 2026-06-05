/* Тренажёр РМ — квиз-приложение.
   Использует window.QUESTIONS из data.js. Состояние в localStorage. */

const TESTS = [
    { id: 1, title: "Теория управления", themes: "Школы, Наука, Теории" },
    { id: 2, title: "Стратегия и среда", themes: "Стратегия, изменения, факторы среды" },
    { id: 3, title: "Организация и личность", themes: "Про организацию, Личность, Файоль" },
    { id: 4, title: "Проекты, продукт, методы", themes: "Проекты, Этапы продукта, Методы" },
    { id: 5, title: "Инновации, кризисы, риски, Lean", themes: "Инновации, кризисы, риски, бережливое" },
    { id: 6, title: "Руководитель, команда, власть", themes: "Руководитель, стиль, власть" },
    { id: 7, title: "Коммуникация и управление", themes: "Коммуникация, персонал, управление, формулы" },
    { id: 8, title: "Новые вопросы", themes: "Доп. блок: организация, мотивация, финансы, маркетинг" },
];

const STORAGE_KEY = "gosy-trainer:v1";

const state = {
    storage: loadStorage(),
    currentQuiz: null,
};

function loadStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { mistakes: {}, bestScores: {}, attempts: {} };
}

function saveStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.storage));
    } catch (e) {}
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function normalize(s) {
    if (s == null) return "";
    return String(s)
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/,/g, ".")
        .replace(/\s+/g, " ")
        .trim();
}

function answersEqual(user, correct) {
    return normalize(user) === normalize(correct);
}

function getQuestionsByTest(testId) {
    return window.QUESTIONS.filter(q => q.test === testId);
}

function getAllMistakeQuestions() {
    const ids = Object.keys(state.storage.mistakes);
    if (!ids.length) return [];
    return window.QUESTIONS.filter(q => ids.includes(q.id));
}

function getTestMistakeQuestions(testId) {
    const ids = Object.keys(state.storage.mistakes);
    return window.QUESTIONS.filter(q => q.test === testId && ids.includes(q.id));
}

/* ------------- Router ------------- */

function navigate(hash) {
    if (location.hash === hash) {
        route();
    } else {
        location.hash = hash;
    }
}

function route() {
    const hash = location.hash || "#/";
    const main = document.getElementById("main");
    main.innerHTML = "";
    state.currentQuiz = null;
    updateTopbarMeta("");

    if (hash === "#/" || hash === "") {
        renderHome(main);
        return;
    }
    const mTest = hash.match(/^#\/test\/(\d+)$/);
    if (mTest) {
        const tid = parseInt(mTest[1], 10);
        startQuiz({ source: "test", testId: tid });
        return;
    }
    const mTestMistakes = hash.match(/^#\/test\/(\d+)\/mistakes$/);
    if (mTestMistakes) {
        const tid = parseInt(mTestMistakes[1], 10);
        startQuiz({ source: "test-mistakes", testId: tid });
        return;
    }
    if (hash === "#/mistakes") {
        startQuiz({ source: "all-mistakes" });
        return;
    }
    if (hash === "#/random") {
        startQuiz({ source: "random" });
        return;
    }
    // Unknown route
    navigate("#/");
}

function updateTopbarMeta(text) {
    document.getElementById("topbar-meta").textContent = text;
}

window.addEventListener("hashchange", route);

/* ------------- Home screen ------------- */

function renderHome(main) {
    const allMistakes = getAllMistakeQuestions();

    let html = `
        <h1>Тренажёр РМ</h1>
        <p class="subtitle">7 тестов по подготовке к экзамену. Прогресс сохраняется в браузере.</p>
        <div class="test-list">
    `;

    for (const t of TESTS) {
        const total = getQuestionsByTest(t.id).length;
        const best = state.storage.bestScores[t.id];
        const attempts = state.storage.attempts[t.id] || 0;
        const testMistakes = getTestMistakeQuestions(t.id).length;
        const metaParts = [];
        if (best != null) metaParts.push(`<b>${best}/${total}</b> лучший`);
        if (attempts) metaParts.push(`${attempts} ${pluralAttempts(attempts)}`);
        if (testMistakes) metaParts.push(`<span style="color:var(--incorrect)">${testMistakes} в ошибках</span>`);
        const meta = metaParts.length ? metaParts.join("<br>") : `${total} вопросов`;
        html += `
            <a class="test-card" href="#/test/${t.id}">
                <div class="test-card-row">
                    <div>
                        <div class="test-card-title">${t.id}. ${escapeHtml(t.title)}</div>
                        <div class="test-card-themes">${escapeHtml(t.themes)} · ${total} вопросов</div>
                    </div>
                    <div class="test-card-meta">${meta}</div>
                </div>
            </a>
        `;
    }

    html += `</div>`;

    html += `
        <div class="special-section">
            <h2>Дополнительно</h2>
            <div class="test-list">
                <a class="test-card special ${allMistakes.length ? "" : "disabled"}" href="${allMistakes.length ? "#/mistakes" : "#"}">
                    <div class="test-card-row">
                        <div>
                            <div class="test-card-title">Тренировать ошибки</div>
                            <div class="test-card-themes">${allMistakes.length ? `Все вопросы, на которых ошибался — ${allMistakes.length} шт.` : "Пока нет ошибок. Пройди хотя бы один тест."}</div>
                        </div>
                        <div class="test-card-meta">${allMistakes.length || "—"}</div>
                    </div>
                </a>
                <a class="test-card special" href="#/random">
                    <div class="test-card-row">
                        <div>
                            <div class="test-card-title">Случайный микс</div>
                            <div class="test-card-themes">50 случайных вопросов из всех 395</div>
                        </div>
                        <div class="test-card-meta">50</div>
                    </div>
                </a>
            </div>
        </div>
    `;

    main.innerHTML = html;
}

function pluralAttempts(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "прохождение";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "прохождения";
    return "прохождений";
}

function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* ------------- Quiz ------------- */

function startQuiz({ source, testId }) {
    let questions;
    let title;
    if (source === "test") {
        questions = getQuestionsByTest(testId);
        title = TESTS.find(t => t.id === testId)?.title || "Тест";
    } else if (source === "test-mistakes") {
        questions = getTestMistakeQuestions(testId);
        title = "Ошибки: " + (TESTS.find(t => t.id === testId)?.title || "");
    } else if (source === "all-mistakes") {
        questions = getAllMistakeQuestions();
        title = "Все ошибки";
    } else if (source === "random") {
        questions = shuffle(window.QUESTIONS).slice(0, 50);
        title = "Случайный микс";
    }

    if (!questions || !questions.length) {
        navigate("#/");
        return;
    }

    const shuffled = shuffle(questions);
    // Per-question shuffled options where applicable
    const prepared = shuffled.map(q => ({
        q,
        // For MC: shuffled order of options
        shuffledOptions: q.type === "mc" ? shuffle(q.options || []) : null,
        // For matching with pairs: shuffled order of right-side answers for select dropdowns
        shuffledRights: q.type === "matching" && q.pairs ? shuffle(q.pairs.map(p => p[1])) : null,
    }));

    state.currentQuiz = {
        source,
        testId,
        title,
        items: prepared,
        index: 0,
        results: [], // { id, type, correct, userAnswer, correctAnswer }
        finished: false,
    };

    renderCurrentQuestion();
}

function renderCurrentQuestion() {
    const quiz = state.currentQuiz;
    const main = document.getElementById("main");
    const item = quiz.items[quiz.index];
    const q = item.q;
    const total = quiz.items.length;
    updateTopbarMeta(`${quiz.title} · ${quiz.index + 1}/${total}`);

    const progress = Math.round(((quiz.index) / total) * 100);

    let html = `
        <div class="quiz-header">
            <span>${escapeHtml(q.section)}</span>
            <span>${quiz.index + 1} из ${total}</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        <div class="question-text">${escapeHtml(q.question)}</div>
    `;
    if (q.image) {
        html += `<img class="question-image" src="images/${escapeHtml(q.image)}" alt="">`;
    }
    if (q.note) {
        html += `<div class="note-hint">${escapeHtml(q.note)}</div>`;
    }

    html += renderQuestionBody(q, item);
    html += `<div id="feedback-slot"></div>`;
    html += `
        <div class="actions">
            <button class="btn secondary" id="btn-home">← К списку тестов</button>
            <button class="btn" id="btn-next" style="display:none">Дальше →</button>
        </div>
    `;

    main.innerHTML = html;

    document.getElementById("btn-home").addEventListener("click", () => navigate("#/"));
    document.getElementById("btn-next").addEventListener("click", onNext);

    bindQuestionInteractions(q, item);
}

function renderQuestionBody(q, item) {
    if (q.type === "mc") {
        const opts = item.shuffledOptions || [];
        const isMulti = (q.correct || []).length > 1;
        if (isMulti) {
            return `
                <div class="note-hint">Выбери <b>все</b> верные варианты (${q.correct.length} шт.) и нажми «Проверить».</div>
                <div class="options-list" id="options">
                    ${opts.map((o, i) => `
                        <button class="option option-multi" data-option="${escapeHtml(o)}" aria-pressed="false">
                            <span class="option-marker option-marker-square">${String.fromCharCode(65 + i)}</span>
                            <span>${escapeHtml(o)}</span>
                        </button>
                    `).join("")}
                </div>
                <div class="actions" style="margin-bottom:16px;">
                    <button class="btn" id="btn-check" disabled>Проверить</button>
                </div>
            `;
        }
        return `<div class="options-list" id="options">
            ${opts.map((o, i) => `
                <button class="option" data-option="${escapeHtml(o)}">
                    <span class="option-marker">${String.fromCharCode(65 + i)}</span>
                    <span>${escapeHtml(o)}</span>
                </button>
            `).join("")}
        </div>`;
    }
    if (q.type === "open") {
        return `
            <input class="open-input" id="open-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Введи ответ">
            <div class="actions" style="margin-bottom:16px;">
                <button class="btn" id="btn-check">Проверить</button>
            </div>
        `;
    }
    if (q.type === "matching") {
        if (q.pairs && q.pairs.length) {
            const rights = item.shuffledRights || [];
            return `
                <div class="options-list" id="matching">
                    ${q.pairs.map((pair, i) => `
                        <div class="matching-row" data-idx="${i}">
                            <span class="matching-row-num">${i + 1}</span>
                            <span class="matching-row-text">${escapeHtml(pair[0])}</span>
                            <select data-idx="${i}">
                                <option value="">— выбери —</option>
                                ${rights.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("")}
                            </select>
                        </div>
                    `).join("")}
                </div>
                <div class="actions" style="margin-bottom:16px;">
                    <button class="btn" id="btn-check">Проверить</button>
                </div>
            `;
        }
        if (q.sequence_answer && q.numbered_items) {
            return `
                <div class="options-list">
                    ${q.numbered_items.map(([n, t]) => `
                        <div class="matching-row">
                            <span class="matching-row-num">${escapeHtml(n)}</span>
                            <span class="matching-row-text">${escapeHtml(t)}</span>
                        </div>
                    `).join("")}
                </div>
                <input class="open-input" id="open-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Введи порядок (например: 132)">
                <div class="actions" style="margin-bottom:16px;">
                    <button class="btn" id="btn-check">Проверить</button>
                </div>
            `;
        }
    }
    return `<div class="placeholder">Не могу отобразить вопрос этого типа</div>`;
}

function bindQuestionInteractions(q, item) {
    if (q.type === "mc") {
        const isMulti = (q.correct || []).length > 1;
        if (isMulti) {
            const btnCheck = document.getElementById("btn-check");
            document.querySelectorAll(".option-multi").forEach(btn => {
                btn.addEventListener("click", () => {
                    const isSelected = btn.getAttribute("aria-pressed") === "true";
                    btn.setAttribute("aria-pressed", isSelected ? "false" : "true");
                    btn.classList.toggle("selected", !isSelected);
                    const anySelected = !!document.querySelector(".option-multi[aria-pressed='true']");
                    btnCheck.disabled = !anySelected;
                });
            });
            btnCheck.addEventListener("click", () => onMcMultiAnswer(q));
        } else {
            document.querySelectorAll(".option").forEach(btn => {
                btn.addEventListener("click", () => onMcAnswer(btn.dataset.option, q));
            });
        }
    } else if (q.type === "open") {
        const input = document.getElementById("open-input");
        document.getElementById("btn-check").addEventListener("click", () => onOpenAnswer(q));
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") onOpenAnswer(q);
        });
        input.focus();
    } else if (q.type === "matching") {
        if (q.pairs && q.pairs.length) {
            document.getElementById("btn-check").addEventListener("click", () => onMatchingAnswer(q));
        } else if (q.sequence_answer) {
            const input = document.getElementById("open-input");
            document.getElementById("btn-check").addEventListener("click", () => onSequenceAnswer(q));
            input.addEventListener("keydown", e => {
                if (e.key === "Enter") onSequenceAnswer(q);
            });
            input.focus();
        }
    }
}

/* ------------- Answer handlers ------------- */

function onMcAnswer(userChoice, q) {
    const correct = q.correct || [];
    const isCorrect = correct.some(c => normalize(c) === normalize(userChoice));
    document.querySelectorAll(".option").forEach(btn => {
        btn.disabled = true;
        const val = btn.dataset.option;
        if (correct.some(c => normalize(c) === normalize(val))) {
            btn.classList.add("correct");
        } else if (val === userChoice) {
            btn.classList.add("incorrect");
        }
    });
    showFeedback(isCorrect, correct.join(" / "));
    recordAnswer({
        q,
        correct: isCorrect,
        userAnswer: userChoice,
        correctAnswer: correct.join(" / "),
    });
}

function onMcMultiAnswer(q) {
    const correctSet = new Set((q.correct || []).map(normalize));
    const buttons = Array.from(document.querySelectorAll(".option-multi"));
    const selected = buttons.filter(b => b.getAttribute("aria-pressed") === "true");
    const selectedSet = new Set(selected.map(b => normalize(b.dataset.option)));

    // Per-option marking
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("selected");
        const val = normalize(btn.dataset.option);
        const isCorrectOption = correctSet.has(val);
        const wasSelected = selectedSet.has(val);
        if (isCorrectOption && wasSelected) {
            btn.classList.add("correct");
        } else if (!isCorrectOption && wasSelected) {
            btn.classList.add("incorrect");
        } else if (isCorrectOption && !wasSelected) {
            // missed — show in green but mark as "missed"
            btn.classList.add("correct", "missed");
        }
    });

    // Overall correctness: sets must match exactly
    const isFullyCorrect =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every(v => correctSet.has(v));

    document.getElementById("btn-check").style.display = "none";
    const correctText = (q.correct || []).join(" / ");
    const userText = selected.map(b => b.dataset.option).join(" / ") || "(ничего не выбрано)";
    showFeedback(isFullyCorrect, correctText);
    recordAnswer({
        q,
        correct: isFullyCorrect,
        userAnswer: userText,
        correctAnswer: correctText,
    });
}

function onOpenAnswer(q) {
    const input = document.getElementById("open-input");
    const userAnswer = input.value.trim();
    if (!userAnswer) return;
    const isCorrect = answersEqual(userAnswer, q.answer);
    input.disabled = true;
    input.classList.add(isCorrect ? "correct" : "incorrect");
    document.getElementById("btn-check").style.display = "none";
    showFeedback(isCorrect, q.answer);
    recordAnswer({
        q,
        correct: isCorrect,
        userAnswer,
        correctAnswer: q.answer,
    });
}

function onMatchingAnswer(q) {
    const selects = document.querySelectorAll("#matching select");
    let allCorrect = true;
    const userAnswerParts = [];
    selects.forEach(sel => {
        const idx = parseInt(sel.dataset.idx, 10);
        const userVal = sel.value;
        const correctVal = q.pairs[idx][1];
        const row = sel.closest(".matching-row");
        const isCorrect = normalize(userVal) === normalize(correctVal);
        row.classList.add(isCorrect ? "correct" : "incorrect");
        sel.disabled = true;
        if (!isCorrect) {
            allCorrect = false;
            // Replace dropdown with correct answer in red
            sel.title = "Правильно: " + correctVal;
        }
        userAnswerParts.push(`${idx + 1}) ${userVal || "(пусто)"}`);
    });
    document.getElementById("btn-check").style.display = "none";
    const correctText = q.pairs.map((p, i) => `${i + 1}) ${p[1]}`).join(" · ");
    showFeedback(allCorrect, correctText);
    recordAnswer({
        q,
        correct: allCorrect,
        userAnswer: userAnswerParts.join(" · "),
        correctAnswer: correctText,
    });
}

function onSequenceAnswer(q) {
    const input = document.getElementById("open-input");
    const userAnswer = input.value.trim().replace(/[^\d]/g, "");
    if (!userAnswer) return;
    const isCorrect = userAnswer === q.sequence_answer;
    input.disabled = true;
    input.classList.add(isCorrect ? "correct" : "incorrect");
    document.getElementById("btn-check").style.display = "none";
    showFeedback(isCorrect, "порядок: " + q.sequence_answer);
    recordAnswer({
        q,
        correct: isCorrect,
        userAnswer,
        correctAnswer: "порядок: " + q.sequence_answer,
    });
}

function showFeedback(isCorrect, correctText) {
    const slot = document.getElementById("feedback-slot");
    slot.innerHTML = `
        <div class="feedback ${isCorrect ? "correct" : "incorrect"}">
            <span class="feedback-label">${isCorrect ? "Верно" : "Неверно"}.</span>
            ${isCorrect ? "" : ` Правильный ответ: ${escapeHtml(correctText)}`}
        </div>
    `;
    document.getElementById("btn-next").style.display = "";
}

function recordAnswer({ q, correct, userAnswer, correctAnswer }) {
    state.currentQuiz.results.push({
        id: q.id,
        section: q.section,
        question: q.question,
        type: q.type,
        correct,
        userAnswer,
        correctAnswer,
    });
    // Update mistake tracking immediately so refresh doesn't lose state
    if (!correct) {
        state.storage.mistakes[q.id] = { wrongCount: (state.storage.mistakes[q.id]?.wrongCount || 0) + 1 };
    } else {
        // If user answered correctly, remove from mistakes
        delete state.storage.mistakes[q.id];
    }
    saveStorage();
}

function onNext() {
    const quiz = state.currentQuiz;
    quiz.index++;
    if (quiz.index >= quiz.items.length) {
        finishQuiz();
    } else {
        renderCurrentQuestion();
    }
}

/* ------------- Results ------------- */

function finishQuiz() {
    const quiz = state.currentQuiz;
    quiz.finished = true;
    const correctCount = quiz.results.filter(r => r.correct).length;
    const total = quiz.results.length;
    const percent = Math.round((correctCount / total) * 100);

    // Record best score for normal test runs
    if (quiz.source === "test") {
        const prev = state.storage.bestScores[quiz.testId];
        if (prev == null || correctCount > prev) {
            state.storage.bestScores[quiz.testId] = correctCount;
        }
        state.storage.attempts[quiz.testId] = (state.storage.attempts[quiz.testId] || 0) + 1;
        saveStorage();
    }

    renderResults(correctCount, total, percent);
}

function renderResults(correct, total, percent) {
    const quiz = state.currentQuiz;
    const main = document.getElementById("main");
    updateTopbarMeta("Результат");
    const mistakes = quiz.results.filter(r => !r.correct);

    let html = `
        <div class="results-summary">
            <div class="results-score">${correct}<span class="results-score-of">/${total}</span></div>
            <div class="results-percent">${percent}%</div>
            <div class="subtitle" style="margin:0;">${escapeHtml(quiz.title)}</div>
        </div>
        <div class="results-actions">
            <button class="btn" id="btn-retry">Пройти ещё раз</button>
            ${mistakes.length ? `<button class="btn secondary" id="btn-train-mistakes">Тренировать ошибки (${mistakes.length})</button>` : ""}
            <button class="btn secondary" id="btn-home">К списку тестов</button>
        </div>
    `;

    if (mistakes.length) {
        html += `<h2>Разбор ошибок (${mistakes.length})</h2><div class="mistakes-list">`;
        for (const m of mistakes) {
            html += `
                <div class="mistake-card">
                    <div class="mistake-q">${escapeHtml(m.question)}</div>
                    <div class="mistake-line mistake-yours">Ты ответил: ${escapeHtml(m.userAnswer || "(пусто)")}</div>
                    <div class="mistake-line mistake-correct">Правильно: ${escapeHtml(m.correctAnswer)}</div>
                    <div class="mistake-section">${escapeHtml(m.section)}</div>
                </div>
            `;
        }
        html += `</div>`;
    } else {
        html += `<div class="placeholder">Без ошибок. Класс.</div>`;
    }

    main.innerHTML = html;

    document.getElementById("btn-retry").addEventListener("click", () => {
        // Re-trigger the same source
        startQuiz({ source: quiz.source, testId: quiz.testId });
    });
    document.getElementById("btn-home").addEventListener("click", () => navigate("#/"));
    const btnMistakes = document.getElementById("btn-train-mistakes");
    if (btnMistakes) {
        btnMistakes.addEventListener("click", () => {
            // Build a custom quiz from the mistake questions in this session
            const mistakeIds = new Set(mistakes.map(m => m.id));
            const qsToTrain = window.QUESTIONS.filter(q => mistakeIds.has(q.id));
            if (!qsToTrain.length) return;
            const shuffled = shuffle(qsToTrain);
            const prepared = shuffled.map(q => ({
                q,
                shuffledOptions: q.type === "mc" ? shuffle(q.options || []) : null,
                shuffledRights: q.type === "matching" && q.pairs ? shuffle(q.pairs.map(p => p[1])) : null,
            }));
            state.currentQuiz = {
                source: "session-mistakes",
                testId: quiz.testId,
                title: "Ошибки прошлого прохождения",
                items: prepared,
                index: 0,
                results: [],
                finished: false,
            };
            renderCurrentQuestion();
        });
    }
}

/* ------------- Boot ------------- */

document.addEventListener("DOMContentLoaded", () => {
    if (!window.QUESTIONS || !window.QUESTIONS.length) {
        document.getElementById("main").innerHTML = `<div class="placeholder">Не удалось загрузить базу вопросов (data.js).</div>`;
        return;
    }
    route();
});
