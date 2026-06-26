/**
 * storage.js — работа с localStorage
 * Сохранение корзины и пользовательских предпочтений
 */

const Storage = {
  KEYS: {
    CART: 'svezhmarket_cart',
    PREFERENCES: 'svezhmarket_preferences'
  },

  /** Получить данные из localStorage */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /** Сохранить данные в localStorage */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /** Удалить данные */
  remove(key) {
    localStorage.removeItem(key);
  },

  /** Корзина: получить все позиции { productId: quantity } */
  getCart() {
    return this.get(this.KEYS.CART) || {};
  },

  /** Корзина: сохранить */
  saveCart(cart) {
    this.set(this.KEYS.CART, cart);
    // Уведомляем другие модули об изменении корзины
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
  },

  /** Предпочтения: получить */
  getPreferences() {
    return this.get(this.KEYS.PREFERENCES) || {
      activeCategory: 'all',
      sortBy: 'default'
    };
  },

  /** Предпочтения: сохранить */
  savePreferences(prefs) {
    const current = this.getPreferences();
    this.set(this.KEYS.PREFERENCES, { ...current, ...prefs });
  }
};
