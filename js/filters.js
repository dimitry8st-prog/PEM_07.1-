/**
 * filters.js — фильтрация товаров по категориям в реальном времени
 */

const Filters = {
  products: [],
  activeCategory: 'all',
  searchQuery: '',

  init(products) {
    this.products = products;
    const prefs = Storage.getPreferences();
    this.activeCategory = prefs.activeCategory || 'all';

    this.renderFilterButtons();
    this.renderCatalog();
    this.bindEvents();
  },

  /** Рендер кнопок фильтров */
  renderFilterButtons() {
    const container = document.getElementById('filters');
    if (!container) return;

    const allBtn = `
      <button type="button" class="filter-btn ${this.activeCategory === 'all' ? 'filter-btn--active' : ''}"
              data-category="all">Все товары</button>
    `;

    const buttons = Products.categories.map(cat => `
      <button type="button" class="filter-btn ${this.activeCategory === cat.id ? 'filter-btn--active' : ''}"
              data-category="${cat.id}">${cat.icon} ${cat.name}</button>
    `).join('');

    container.innerHTML = allBtn + buttons;
  },

  /** Получить отфильтрованный список */
  getFiltered() {
    let result = [...this.products];

    // Фильтр по категории
    if (this.activeCategory !== 'all') {
      result = result.filter(p => p.category === this.activeCategory);
    }

    // Фильтр по поиску
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        Products.getCategoryName(p.category).toLowerCase().includes(q)
      );
    }

    return result;
  },

  /** Установить категорию */
  setCategory(categoryId) {
    this.activeCategory = categoryId;
    Storage.savePreferences({ activeCategory: categoryId });
    this.renderFilterButtons();
    this.updateCategoryCards();
    this.renderCatalog();
  },

  /** Установить поисковый запрос */
  setSearchQuery(query) {
    this.searchQuery = query.trim().toLowerCase();
    this.renderCatalog();
  },

  /** Рендер каталога */
  renderCatalog() {
    const grid = document.getElementById('products-grid');
    const countEl = document.getElementById('products-count');
    const emptyEl = document.getElementById('empty-state');
    const filtered = this.getFiltered();

    if (countEl) {
      const word = this.pluralize(filtered.length, 'товар', 'товара', 'товаров');
      countEl.textContent = `${filtered.length} ${word}`;
    }

    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0;
    }

    Products.renderGrid(grid, filtered, { showBadge: true });
  },

  /** Обновить активную категорию в сетке категорий */
  updateCategoryCards() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    grid.querySelectorAll('.category-card').forEach(card => {
      card.classList.toggle('category-card--active', card.dataset.category === this.activeCategory);
    });
  },

  /** Склонение слов */
  pluralize(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
  },

  /** Привязка событий */
  bindEvents() {
    const filtersEl = document.getElementById('filters');
    const categoriesEl = document.getElementById('categories-grid');

    filtersEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      this.setCategory(btn.dataset.category);
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });

    categoriesEl?.addEventListener('click', (e) => {
      const card = e.target.closest('.category-card');
      if (!card) return;
      this.setCategory(card.dataset.category);
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });

    window.addEventListener('search-changed', (e) => {
      this.setSearchQuery(e.detail);
    });
  }
};
