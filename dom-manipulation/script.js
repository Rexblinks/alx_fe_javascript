// script.js
// Dynamic Quote Generator with DOM manipulation + Web Storage + JSON Import/Export + Category Filtering

(() => {
  'use strict';

  const STORAGE_KEY = 'dqg_quotes_v1';
  const FILTER_KEY = 'dqg_last_filter';

  const defaultQuotes = [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
    { text: "Creativity is intelligence having fun.", category: "Creativity" },
    { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Development" }
  ];

  // ---------- Storage ----------
  function loadQuotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...defaultQuotes];
      return JSON.parse(raw);
    } catch {
      return [...defaultQuotes];
    }
  }

  function saveQuotes(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function saveFilterPreference(category) {
    localStorage.setItem(FILTER_KEY, category);
  }

  function loadFilterPreference() {
    return localStorage.getItem(FILTER_KEY) || "all";
  }

  // ---------- DOM ----------
  const quoteDisplay = document.getElementById('quoteDisplay');
  const newQuoteBtn = document.getElementById('newQuote');
  const categoryFilter = document.getElementById('categoryFilter');
  const filteredQuotesDiv = document.getElementById('filteredQuotes');

  // ---------- State ----------
  let quotes = loadQuotes();

  // ---------- Rendering ----------
  function getCategories() {
    return [...new Set(quotes.map(q => q.category))].sort();
  }

  function renderCategoryOptions(selectElem, includeAll = true) {
    selectElem.innerHTML = "";
    if (includeAll) {
      const opt = document.createElement("option");
      opt.value = "all";
      opt.textContent = "All Categories";
      selectElem.appendChild(opt);
    }
    for (const cat of getCategories()) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      selectElem.appendChild(opt);
    }
  }

  function renderQuote(quote, mount) {
    const div = document.createElement("div");
    div.className = "quote-card";
    div.innerHTML = `<blockquote>“${quote.text}”</blockquote>
                     <p><em>${quote.category}</em></p>`;
    mount.appendChild(div);
  }

  // ---------- Random Quote ----------
  function showRandomQuote() {
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    quoteDisplay.innerHTML = "";
    renderQuote(random, quoteDisplay);
  }

  // ---------- Add Quote ----------
  function addQuote(event) {
    event.preventDefault();
    const text = document.getElementById('newQuoteText').value.trim();
    const category = document.getElementById('newQuoteCategory').value.trim();
    if (!text || !category) return alert("Please fill in both fields.");

    quotes.push({ text, category });
    saveQuotes(quotes);

    // update filter dropdown
    renderCategoryOptions(categoryFilter, true);

    alert("Quote added!");
    document.getElementById('newQuoteText').value = "";
    document.getElementById('newQuoteCategory').value = "";
  }

  // ---------- Filtering ----------
  function populateCategories() {
    renderCategoryOptions(categoryFilter, true);

    // restore last filter if exists
    const lastFilter = loadFilterPreference();
    categoryFilter.value = lastFilter;
    filterQuotes();
  }

  function filterQuotes() {
    const selected = categoryFilter.value;
    filteredQuotesDiv.innerHTML = "";

    let filtered = (selected === "all")
      ? quotes
      : quotes.filter(q => q.category === selected);

    if (filtered.length === 0) {
      filteredQuotesDiv.textContent = "No quotes in this category.";
    } else {
      filtered.forEach(q => renderQuote(q, filteredQuotesDiv));
    }

    saveFilterPreference(selected);
  }

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
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid JSON");
        quotes.push(...imported);
        saveQuotes(quotes);
        renderCategoryOptions(categoryFilter, true);
        filterQuotes();
        alert("Quotes imported!");
      } catch (err) {
        alert("Error importing JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ---------- Init ----------
  newQuoteBtn.addEventListener("click", showRandomQuote);
  document.querySelector("form").addEventListener("submit", addQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);
  document.getElementById("importFile").addEventListener("change", importFromJsonFile);

  populateCategories();
  showRandomQuote();

})();