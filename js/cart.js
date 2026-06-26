/**
 * cart.js — управление корзиной с реал-тайм обновлениями
 */

const Cart = {
  items: {},
  products: [],

  /** Инициализация корзины */
  init(products) {
    this.products = products;
    this.items = Storage.getCart();
    this.bindUI();
    this.render();
  },

  /** Получить количество товара в корзине */
  getQuantity(productId) {
    return this.items[productId] || 0;
  },

  /** Общее количество позиций */
  getTotalCount() {
    return Object.values(this.items).reduce((sum, qty) => sum + qty, 0);
  },

  /** Общая сумма */
  getTotalPrice() {
    return Object.entries(this.items).reduce((sum, [id, qty]) => {
      const product = this.products.find(p => p.id === Number(id));
      return sum + (product ? product.price * qty : 0);
    }, 0);
  },

  /** Добавить товар */
  add(productId) {
    this.items[productId] = (this.items[productId] || 0) + 1;
    this.save();
    this.showToast('Товар добавлен в корзину');
  },

  /** Уменьшить количество */
  decrease(productId) {
    if (!this.items[productId]) return;

    this.items[productId]--;
    if (this.items[productId] <= 0) {
      delete this.items[productId];
    }
    this.save();
  },

  /** Удалить товар из корзины */
  remove(productId) {
    delete this.items[productId];
    this.save();
  },

  /** Сохранить и уведомить */
  save() {
    Storage.saveCart(this.items);
    this.render();
    this.updateProductCards();
  },

  /** Привязка UI-элементов корзины */
  bindUI() {
    const toggle = document.getElementById('cart-toggle');
    const close = document.getElementById('cart-close');
    const overlay = document.getElementById('cart-overlay');
    const panel = document.getElementById('cart-panel');
    const checkout = document.getElementById('checkout-btn');

    toggle?.addEventListener('click', () => this.open());
    close?.addEventListener('click', () => this.close());
    overlay?.addEventListener('click', () => this.close());

    checkout?.addEventListener('click', () => {
      if (this.getTotalCount() > 0) {
        alert(`Заказ оформлен на сумму ${Products.formatPrice(this.getTotalPrice())}!\nСпасибо за покупку в СвежМаркет!`);
        this.items = {};
        this.save();
        this.close();
      }
    });

    // Слушаем обновления из других вкладок
    window.addEventListener('storage', (e) => {
      if (e.key === Storage.KEYS.CART) {
        this.items = Storage.getCart();
        this.render();
        this.updateProductCards();
      }
    });

    window.addEventListener('cart-updated', () => {
      this.updateProductCards();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  },

  /** Открыть панель корзины */
  open() {
    const panel = document.getElementById('cart-panel');
    panel?.classList.add('cart-panel--open');
    panel?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  /** Закрыть панель корзины */
  close() {
    const panel = document.getElementById('cart-panel');
    panel?.classList.remove('cart-panel--open');
    panel?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  /** Обновить счётчик и содержимое корзины */
  render() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    const itemsEl = document.getElementById('cart-items');
    const checkout = document.getElementById('checkout-btn');
    const count = this.getTotalCount();

    if (countEl) {
      const prevCount = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = count;
      if (count > prevCount) {
        countEl.classList.add('cart-badge--pulse');
        setTimeout(() => countEl.classList.remove('cart-badge--pulse'), 300);
      }
    }

    if (totalEl) {
      totalEl.textContent = Products.formatPrice(this.getTotalPrice());
    }

    if (checkout) {
      checkout.disabled = count === 0;
    }

    if (!itemsEl) return;

    if (count === 0) {
      itemsEl.innerHTML = '<p class="cart-panel__empty">Корзина пуста</p>';
      return;
    }

    itemsEl.innerHTML = Object.entries(this.items).map(([id, qty]) => {
      const product = this.products.find(p => p.id === Number(id));
      if (!product) return '';

      const alt = SEO.generateAlt(product);
      return `
        <div class="cart-item" data-product-id="${product.id}">
          <img class="cart-item__image" src="${product.image}" alt="${alt}" width="64" height="64">
          <div class="cart-item__info">
            <p class="cart-item__name">${product.name}</p>
            <p class="cart-item__price">${Products.formatPrice(product.price)} / ${product.unit}</p>
            <div class="cart-item__actions">
              <div class="qty-control">
                <button type="button" class="qty-control__btn" data-action="decrease" aria-label="Уменьшить">−</button>
                <span class="qty-control__value">${qty}</span>
                <button type="button" class="qty-control__btn" data-action="increase" aria-label="Увеличить">+</button>
              </div>
              <span class="cart-item__subtotal">${Products.formatPrice(product.price * qty)}</span>
            </div>
          </div>
          <button type="button" class="cart-item__remove" data-action="remove" aria-label="Удалить ${product.name}">Удалить</button>
        </div>
      `;
    }).join('');

    // События в корзине
    itemsEl.querySelectorAll('.cart-item').forEach(item => {
      const id = Number(item.dataset.productId);

      item.querySelector('[data-action="decrease"]')?.addEventListener('click', () => this.decrease(id));
      item.querySelector('[data-action="increase"]')?.addEventListener('click', () => this.add(id));
      item.querySelector('[data-action="remove"]')?.addEventListener('click', () => this.remove(id));
    });
  },

  /** Обновить кнопки/счётчики на карточках товаров */
  updateProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const id = Number(card.dataset.productId);
      const qty = this.getQuantity(id);
      const footer = card.querySelector('.product-card__footer');
      if (!footer) return;

      const priceEl = footer.querySelector('.product-card__price');
      const priceHtml = priceEl ? priceEl.outerHTML : '';

      const controlHtml = qty > 0
        ? `
          <div class="qty-control" data-product-id="${id}">
            <button type="button" class="qty-control__btn" data-action="decrease" aria-label="Уменьшить">−</button>
            <span class="qty-control__value">${qty}</span>
            <button type="button" class="qty-control__btn" data-action="increase" aria-label="Увеличить">+</button>
          </div>
        `
        : `<button type="button" class="product-card__add-btn" data-product-id="${id}">В корзину</button>`;

      footer.innerHTML = priceHtml + controlHtml;
    });

    // Перепривязка событий
    document.querySelectorAll('.products__grid').forEach(grid => {
      Products.bindCardEvents(grid);
    });
  },

  /** Всплывающее уведомление */
  showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('toast--visible');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2000);
  }
};
