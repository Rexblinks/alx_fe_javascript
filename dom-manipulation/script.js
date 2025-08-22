// script.js
// Dynamic Quote Generator with advanced DOM manipulation + Web Storage + JSON Import/Export

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

  // ---------- Session Storage for last viewed quote ----------
  function saveLastViewedQuote(quote) {
    sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
  }

  function loadLastViewedQuote() {
    try {
      const data = sessionStorage.getItem("lastViewedQuote");
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  function sortCategories(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  // ---------- Grab initial anchors from the HTML ----------
  const quoteDisplay = document.getElementById('quoteDisplay');
  const newQuoteBtn = document.getElementById('newQuote');

  if (!quoteDisplay || !newQuoteBtn) {
    throw new Error("Missing #quoteDisplay or #newQuote in index.html");
  }

  quoteDisplay.setAttribute('role', 'status');
  quoteDisplay.setAttribute('aria-live', 'polite');

  // Inject category select
  const controls = document.createElement('div');
  controls.id = 'controls';
  controls.style.display = 'flex';
  controls.style.gap = '0.5rem';
  controls.style.flexWrap = 'wrap';
  controls.style.alignItems = 'center';
  newQuoteBtn.parentNode.insertBefore(controls, newQuoteBtn);

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'Category: ';
  categoryLabel.setAttribute('for', 'categorySelect');

  const categorySelect = document.createElement('select');
  categorySelect.id = 'categorySelect';
  categorySelect.ariaLabel = 'Filter quotes by category';

  controls.appendChild(categoryLabel);
  controls.appendChild(categorySelect);

  // Mount point for form
  const formMount = document.createElement('div');
  formMount.id = 'formMount';
  formMount.style.marginTop = '1rem';
  newQuoteBtn.insertAdjacentElement('afterend', formMount);

  // Quote template
  const quoteTemplate = document.createElement('template');
  quoteTemplate.id = 'quoteTemplate';
  quoteTemplate.innerHTML = `
    <figure class="quote-card">
      <blockquote class="quote-text"></blockquote>
      <figcaption class="quote-meta"></figcaption>
    </figure>
  `;
  document.body.appendChild(quoteTemplate);

  // Minimal styles
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

    categorySelect.replaceChildren(fragment);
  }

  function renderQuote(quote) {
    const clone = quoteTemplate.content.cloneNode(true);
    const block = clone.querySelector('.quote-text');
    const meta = clone.querySelector('.quote-meta');

    block.textContent = “${quote.text}”;
    meta.textContent = Category: ${quote.category};

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

    let idx;
    if (category === lastShown.category && pool.length > 1) {
      do { idx = Math.floor(Math.random() * pool.length); }
      while (idx === lastShown.index);
    } else {
      idx = Math.floor(Math.random() * pool.length);
    }

    const selected = pool[idx];
    renderQuote(selected);
    lastShown = { category, index: idx };

    // Save to sessionStorage
    saveLastViewedQuote(selected);
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

    form.addEventListener('submit', addQuote);
    formMount.replaceChildren(form);
  }

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

  window.addQuote = function() {
    const form = document.querySelector('form.add-quote');
    if (!form) return;
    const ev = new Event('submit', { cancelable: true, bubbles: true });
    form.dispatchEvent(ev);
  };

  // ---------- JSON Export ----------
  function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  // ---------- JSON Import ----------
  function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      try {
        const importedQuotes = JSON.parse(e.target.result);
        if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON structure");

        for (const q of importedQuotes) {
          if (q.text && q.category) {
            const exists = quotes.some(
              existing => existing.text.toLowerCase() === q.text.toLowerCase() &&
                          existing.category.toLowerCase() === q.category.toLowerCase()
            );
            if (!exists) quotes.push(q);
          }
        }

        saveQuotes(quotes);
        renderCategoryOptions();
        alert("Quotes imported successfully!");
      } catch (err) {
        alert("Failed to import quotes: " + err.message);
      }
    };
    fileReader.readAsText(file);
  }

  // ---------- Wire up controls ----------
  newQuoteBtn.addEventListener('click', showRandomQuote);
  categorySelect.addEventListener('change', showRandomQuote);

  // ---------- Boot ----------
  renderCategoryOptions();
  createAddQuoteForm();

  // Restore last viewed quote from session if exists
  const lastQuote = loadLastViewedQuote();
  if (lastQuote) {
    renderQuote(lastQuote);
  } else {
    showRandomQuote();
  }

  // Hook up import/export buttons
  document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);
  document.getElementById("importFile").addEventListener("change", importFromJsonFile);

})();