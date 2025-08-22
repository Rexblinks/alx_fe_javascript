// Quotes array with categories
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success" },
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");
const categorySelect = document.getElementById("categorySelect");

// Initialize categories dropdown
function populateCategories() {
  // Clear existing options
  categorySelect.innerHTML = "";

  // Unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Add "All" option
  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All";
  categorySelect.appendChild(allOption);

  // Add each category
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Show random quote based on category filter
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "All") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  // Clear display before showing
  quoteDisplay.innerHTML = "";

  // Create elements dynamically
  const quoteTextEl = document.createElement("p");
  quoteTextEl.textContent = `"${quote.text}"`;

  const quoteCategoryEl = document.createElement("small");
  quoteCategoryEl.textContent = `Category: ${quote.category}`;

  // Append elements
  quoteDisplay.appendChild(quoteTextEl);
  quoteDisplay.appendChild(quoteCategoryEl);
}

// Add new quote dynamically
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (text === "" || category === "") {
    alert("Please fill in both fields before adding a quote.");
    return;
  }

  // Push new quote
  quotes.push({ text, category });

  // Clear input fields
  newQuoteText.value = "";
  newQuoteCategory.value = "";

  // Update category dropdown dynamically
  populateCategories();

  alert("New quote added successfully!");
}

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
categorySelect.addEventListener("change", showRandomQuote);

// Initialize dropdown and first quote
populateCategories();
showRandomQuote();
