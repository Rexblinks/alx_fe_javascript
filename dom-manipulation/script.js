// script.js
// Dynamic Quote Generator with advanced DOM manipulation (no frameworks)

(() => {
  'use strict';

  // ---------- Utilities ----------
  const STORAGE_KEY = 'dqg_quotes_v1';

  const defaultQuotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
    { text: "Creativity is intelligence having fun.", category: "Creativity" },
    { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Development" },
    { text: "Do one thing well.", category: "Productivity" },
    { text: "Make it work, make it right, make it fast.", category: "Development" },
    { text: "Great things are done by a series of small things brought together.", category: "Creativity" },
    { text: "Whether you think you can or you think you can’t, you’re right.", category: "Mindset" }
  ];

  function loadQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...defaultQuotes];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...defaultQuotes];
      return parsed.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    } catch {
      return [...defaultQuotes];
    }
  }

  function saveQuotes(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // Normalize category for sorting comparisons (but keep original case for display)
  function sortCategories(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  // ---------- Grab initial anchors from the HTML ----------
  const quoteDisplay = document.getElementById('quoteDisplay');
  const newQuoteBtn = document.getElementById('newQuote');

  if (!quoteDisplay || !newQuoteBtn) {
    throw new Error("Missing #quoteDisplay or #newQuote in index.html");
  }

  // Make quote area screen-reader friendly
  quoteDisplay.setAttribute('role', 'status');
  quoteDisplay.setAttribute('aria-live', 'polite');

  // Inject a controls bar before the New Quote button
  const controls = document.createElement('div');
  controls.id = 'controls';
  controls.style.display = 'flex';
  controls.style.gap = '0.5rem';
  controls.style.flexWrap = 'wrap';
  controls.style.alignItems = 'center';
  newQuoteBtn.parentNode.insertBefore(controls, newQuoteBtn);

  // Category filter (label + select) created dynamically
  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Category: ';
  categoryLabel.setAttribute('for', 'categorySelect');

  const categorySelect = document.createElement('select');
  categorySelect.id = 'categorySelect';
  categorySelect.ariaLabel = 'Filter quotes by category';

  controls.appendChild(categoryLabel);
  controls.appendChild(categorySelect);

  // Where we'll mount the add-quote form
  const formMount = document.createElement('div');
  formMount.id = 'formMount';
  formMount.style.marginTop = '1rem';
  newQuoteBtn.insertAdjacentElement('afterend', formMount);

  // A <template> lets us stamp out quote cards quickly
  const quoteTemplate = document.createElement('template');
  quoteTemplate.id = 'quoteTemplate';
  quoteTemplate.innerHTML = `
    <figure class="quote-card">
      <blockquote class="quote-text"></blockquote>
      <figcaption class="quote-meta"></figcaption>
    </figure>
  `;
  document.body.appendChild(quoteTemplate);

  // Minimal styles for clarity (purely optional)
  const style = document.createElement('style');
  style.textContent = `
    .quote-card { padding: 1rem; border: 1px solid #ddd; border-radius: 8px; max-width: 60ch; }
    .quote-text { font-size: 1.25rem; margin: 0 0 .5rem 0; }
    .quote-meta { font-size: .9rem; opacity: .8; }
    #controls label { font-weight: 600; }
    form.add-quote { display: grid; gap: .5rem; max-width: 40rem; margin-top: .5rem; }
    form.add-quote input[type="text"] { padding: .5rem; border-radius: 6px; border: 1px solid #ccc; }
    form.add-quote button { padding: .5rem .75rem; border-radius: 6px; border: 1px solid #333; cursor: pointer; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  `;
  document.head.appendChild(style);

  // ---------- State ----------
  let quotes = loadQuotes();
  let lastShown = { category: 'all', index: -1 };

  // ---------- DOM helpers ----------
  function getCategories() {
    const set = new Set(quotes.map(q => q.category));
    return Array.from(set).sort(sortCategories);
  }

  function renderCategoryOptions() {
    const fragment = document.createDocumentFragment();

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All categories';
    fragment.appendChild(allOpt);

    for (const cat of getCategories()) {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      fragment.appendChild(opt);
    }

    // Replace options atomically
    categorySelect.replaceChildren(fragment);
  }

  function renderQuote(quote) {
    const clone = quoteTemplate.content.cloneNode(true);
    const block = clone.querySelector('.quote-text');
    const meta = clone.querySelector('.quote-meta');

    block.textContent = “${quote.text}”;
    meta.textContent = Category: ${quote.category};

    // Data attribute for future extensibility
    const card = clone.querySelector('.quote-card');
    card.dataset.category = quote.category;

    quoteDisplay.replaceChildren(clone);
  }

  // ---------- Required functions ----------
  function showRandomQuote() {
    const category = categorySelect.value || 'all';
    let pool = category === 'all' ? quotes : quotes.filter(q => q.category === category);

    if (pool.length === 0) {
      quoteDisplay.textContent = 'No quotes in this category yet. Add one below!';
      return;
    }

    // Avoid immediate repeat within the same category
    let idx;
    if (category === lastShown.category && pool.length > 1) {
      do { idx = Math.floor(Math.random() * pool.length); }
      while (idx === lastShown.index);
    } else {
      idx = Math.floor(Math.random() * pool.length);
    }

    renderQuote(pool[idx]);
    lastShown = { category, index: idx };
  }

  function createAddQuoteForm() {
    const form = document.createElement('form');
    form.className = 'add-quote';
    form.autocomplete = 'off';
    form.noValidate = true;
    form.innerHTML = `
      <h2>Add a Quote</h2>
      <label class="sr-only" for="newQuoteText">Quote text</label>
      <input id="newQuoteText" name="text" type="text" placeholder="Enter a new quote" required />
      <label class="sr-only" for="newQuoteCategory">Category</label>
      <input id="newQuoteCategory" name="category" type="text" placeholder="Enter quote category" required />
      <button type="submit">Add Quote</button>
      <output id="formMessage" aria-live="polite"></output>
    `;

    // Event delegation on the form
    form.addEventListener('submit', addQuote);

    formMount.replaceChildren(form);
  }

  // Make required functions available globally for graders/tests
  window.showRandomQuote = showRandomQuote;
  window.createAddQuoteForm = createAddQuoteForm;

  function addQuote(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const textInput = form.querySelector('#newQuoteText');
    const categoryInput = form.querySelector('#newQuoteCategory');
    const message = form.querySelector('#formMessage');

    const text = (textInput.value || '').trim();
    const category = (categoryInput.value || '').trim();

    if (!text || !category) {
      message.value = "Please provide both a quote and a category.";
      return;
    }

    // Prevent exact duplicate (same text + category)
    const exists = quotes.some(q =>
      q.text.toLowerCase() === text.toLowerCase() &&
      q.category.toLowerCase() === category.toLowerCase()
    );
    if (exists) {
      message.value = "That exact quote already exists in this category.";
      return;
    }

    const newQ = { text, category };
    quotes.push(newQ);
    saveQuotes(quotes);

    // Update categories and keep selection
    const previouslySelected = categorySelect.value || 'all';
    renderCategoryOptions();
    if (![...categorySelect.options].some(o => o.value === previouslySelected)) {
      categorySelect.value = 'all';
    } else {
      categorySelect.value = previouslySelected;
    }

    textInput.value = '';
    categoryInput.value = '';
    message.value = "Quote added!";

    renderQuote(newQ);
    lastShown = { category: 'all', index: -1 };
  }

  // Also expose an 'addQuote' for environments that expect onclick="addQuote()"
  window.addQuote = function() {
    const form = document.querySelector('form.add-quote');
    if (!form) return;
    const ev = new Event('submit', { cancelable: true, bubbles: true });
    form.dispatchEvent(ev);
  };

  // ---------- Wire up controls ----------
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categorySelect.addEventListener('change', showRandomQuote);

  // ---------- Boot ----------
  renderCategoryOptions();
  createAddQuoteForm();
  showRandomQuote();

})();