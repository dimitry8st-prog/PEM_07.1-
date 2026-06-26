/**
 * search.js — поиск товаров в реальном времени с подсказками
 */

const Search = {
  input: null,
  suggestionsEl: null,
  products: [],
  activeIndex: -1,
  debounceTimer: null,

  init(products) {
    this.products = products;
    this.input = document.getElementById('search-input');
    this.suggestionsEl = document.getElementById('search-suggestions');

    if (!this.input) return;

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('keydown', (e) => this.onKeydown(e));
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim()) this.showSuggestions(this.search(this.input.value));
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search')) {
        this.hideSuggestions();
      }
    });
  },

  /** Поиск по названию, описанию и категории */
  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return this.products.filter(p => {
      const categoryName = Products.getCategoryName(p.category).toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        categoryName.includes(q)
      );
    }).slice(0, 8);
  },

  /** Подсветка совпадений в тексте */
  highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  /** Обработка ввода с debounce */
  onInput() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const query = this.input.value;
      const results = this.search(query);

      if (query.trim()) {
        this.showSuggestions(results, query);
        // Уведомляем фильтры о поисковом запросе
        window.dispatchEvent(new CustomEvent('search-changed', { detail: query }));
      } else {
        this.hideSuggestions();
        window.dispatchEvent(new CustomEvent('search-changed', { detail: '' }));
      }
    }, 150);
  },

  /** Отображение подсказок */
  showSuggestions(results, query = '') {
    if (!this.suggestionsEl) return;

    if (results.length === 0) {
      this.suggestionsEl.innerHTML = `
        <li class="search__suggestion" role="option">
          <span class="search__suggestion-name">Ничего не найдено</span>
        </li>
      `;
      this.suggestionsEl.hidden = false;
      return;
    }

    this.suggestionsEl.innerHTML = results.map((p, i) => {
      const alt = SEO.generateAlt(p);
      return `
        <li class="search__suggestion ${i === this.activeIndex ? 'search__suggestion--active' : ''}"
            role="option" data-product-id="${p.id}" data-index="${i}">
          <img src="${p.image}" alt="${alt}" width="40" height="40">
          <div class="search__suggestion-info">
            <div class="search__suggestion-name">${this.highlight(p.name, query)}</div>
            <div class="search__suggestion-price">${Products.formatPrice(p.price)}</div>
          </div>
        </li>
      `;
    }).join('');

    this.suggestionsEl.hidden = false;
    this.activeIndex = -1;

    this.suggestionsEl.querySelectorAll('.search__suggestion[data-product-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.productId;
        window.location.href = `product.html?id=${id}`;
      });
    });
  },

  hideSuggestions() {
    if (this.suggestionsEl) {
      this.suggestionsEl.hidden = true;
      this.activeIndex = -1;
    }
  },

  /** Навигация клавиатурой */
  onKeydown(e) {
    const items = this.suggestionsEl?.querySelectorAll('[data-product-id]');
    if (!items || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
      this.updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
      this.updateActiveSuggestion(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.activeIndex >= 0 && items[this.activeIndex]) {
        const id = items[this.activeIndex].dataset.productId;
        window.location.href = `product.html?id=${id}`;
      } else {
        this.hideSuggestions();
        window.dispatchEvent(new CustomEvent('search-changed', { detail: this.input.value }));
        // Прокрутка к каталогу
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'Escape') {
      this.hideSuggestions();
    }
  },

  updateActiveSuggestion(items) {
    items.forEach((item, i) => {
      item.classList.toggle('search__suggestion--active', i === this.activeIndex);
    });
  },

  /** Текущий поисковый запрос */
  getQuery() {
    return this.input?.value.trim().toLowerCase() || '';
  }
};
