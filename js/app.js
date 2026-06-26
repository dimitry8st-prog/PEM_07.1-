/**
 * app.js — точка входа главной страницы
 */

document.addEventListener('DOMContentLoaded', async () => {
  const products = await Products.load();

  if (!products.length) {
    document.getElementById('products-grid').innerHTML =
      '<p class="loading">Не удалось загрузить товары. Откройте сайт через локальный сервер.</p>';
    return;
  }

  // Инициализация модулей
  Cart.init(products);
  Search.init(products);
  Filters.init(products);

  // Рендер категорий
  const categoriesGrid = document.getElementById('categories-grid');
  const prefs = Storage.getPreferences();
  Products.renderCategories(categoriesGrid, prefs.activeCategory);

  // Рендер популярных товаров
  const popular = products.filter(p => p.popular);
  Products.renderGrid(document.getElementById('popular-grid'), popular, { showBadge: true, compact: true });

  // Обработка якоря категории из URL
  const hash = window.location.hash;
  if (hash.startsWith('#category-')) {
    const categoryId = hash.replace('#category-', '');
    Filters.setCategory(categoryId);
  }
});
