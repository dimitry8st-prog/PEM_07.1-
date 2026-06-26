/**
 * products.js — загрузка данных и рендеринг карточек товаров
 */

const Products = {
  data: null,
  categories: [],

  /** Загрузка данных товаров (fetch или fallback для file://) */
  async load() {
    if (this.data) return this.data;

    try {
      const response = await fetch('data/products.json');
      if (response.ok) {
        const json = await response.json();
        this.data = json.products;
        this.categories = json.categories;
        return this.data;
      }
    } catch {
      // fetch недоступен при открытии через file://
    }

    if (window.PRODUCTS_DATA) {
      this.data = window.PRODUCTS_DATA.products;
      this.categories = window.PRODUCTS_DATA.categories;
      return this.data;
    }

    console.error('Не удалось загрузить каталог товаров');
    return [];
  },

  /** Получить товар по ID */
  getById(id) {
    return this.data?.find(p => p.id === Number(id)) || null;
  },

  /** Получить название категории */
  getCategoryName(categoryId) {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  },

  /** Рендер звёзд рейтинга */
  renderRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) stars += '★';
      else if (i === fullStars && hasHalf) stars += '★';
      else stars += '☆';
    }

    return `
      <div class="rating" aria-label="Рейтинг ${rating} из 5">
        <span class="rating__stars" aria-hidden="true">${stars}</span>
        <span class="rating__value">${rating}</span>
      </div>
    `;
  },

  /** Форматирование цены */
  formatPrice(price) {
    return `${price.toLocaleString('ru-RU')} ₽`;
  },

  /** Рендер одной карточки товара */
  renderCard(product, options = {}) {
    const { showBadge = false, compact = false } = options;
    const cartQty = Cart.getQuantity(product.id);
    const alt = SEO.generateAlt(product);

    const badgeHtml = showBadge && product.popular
      ? '<span class="product-card__badge">Хит</span>'
      : '';

    const cartControlHtml = cartQty > 0
      ? `
        <div class="qty-control" data-product-id="${product.id}">
          <button type="button" class="qty-control__btn" data-action="decrease" aria-label="Уменьшить количество">−</button>
          <span class="qty-control__value" aria-live="polite">${cartQty}</span>
          <button type="button" class="qty-control__btn" data-action="increase" aria-label="Увеличить количество">+</button>
        </div>
      `
      : `<button type="button" class="product-card__add-btn" data-product-id="${product.id}" aria-label="Добавить ${product.name} в корзину">В корзину</button>`;

    const descriptionHtml = compact
      ? ''
      : `<p class="product-card__description">${product.description}</p>`;

    return `
      <article class="product-card" role="listitem" data-product-id="${product.id}">
        ${badgeHtml}
        <a href="product.html?id=${product.id}" class="product-card__link">
          <div class="product-card__image">
            <img src="${product.image}" alt="${alt}" loading="lazy" width="400" height="400">
          </div>
        </a>
        <div class="product-card__body">
          <a href="product.html?id=${product.id}" class="product-card__link">
            <h3 class="product-card__name">${product.name}</h3>
          </a>
          <span class="product-card__unit">${product.unit}</span>
          ${this.renderRating(product.rating)}
          ${descriptionHtml}
          <div class="product-card__footer">
            <span class="product-card__price">${this.formatPrice(product.price)}</span>
            ${cartControlHtml}
          </div>
        </div>
      </article>
    `;
  },

  /** Рендер сетки товаров */
  renderGrid(container, products, options = {}) {
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = products
      .map(p => this.renderCard(p, options))
      .join('');

    this.bindCardEvents(container);
  },

  /** Привязка событий к кнопкам в карточках */
  bindCardEvents(container) {
    container.querySelectorAll('.product-card__add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = Number(btn.dataset.productId);
        Cart.add(id);
      });
    });

    container.querySelectorAll('.qty-control').forEach(control => {
      const id = Number(control.dataset.productId);

      control.querySelector('[data-action="decrease"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Cart.decrease(id);
      });

      control.querySelector('[data-action="increase"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Cart.add(id);
      });
    });
  },

  /** Рендер карточек категорий */
  renderCategories(container, activeCategory = 'all') {
    if (!container) return;

    const allBtn = `
      <button type="button" class="category-card ${activeCategory === 'all' ? 'category-card--active' : ''}"
              data-category="all" role="listitem">
        <span class="category-card__icon">🛒</span>
        <span class="category-card__name">Все</span>
      </button>
    `;

    const categoryCards = this.categories.map(cat => `
      <button type="button" class="category-card ${activeCategory === cat.id ? 'category-card--active' : ''}"
              data-category="${cat.id}" role="listitem">
        <span class="category-card__icon">${cat.icon}</span>
        <span class="category-card__name">${cat.name}</span>
      </button>
    `).join('');

    container.innerHTML = allBtn + categoryCards;
  }
};
