/**
 * product-page.js — страница отдельного товара
 */

document.addEventListener('DOMContentLoaded', async () => {
  const products = await Products.load();
  Cart.init(products);
  Search.init(products);

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = Products.getById(productId);

  const detailEl = document.getElementById('product-detail');
  const recipesSection = document.getElementById('recipes-section');
  const recipesGrid = document.getElementById('recipes-grid');

  if (!product) {
    detailEl.innerHTML = `
      <div class="empty-state">
        <h2>Товар не найден</h2>
        <p><a href="index.html">Вернуться в каталог</a></p>
      </div>
    `;
    return;
  }

  const categoryName = Products.getCategoryName(product.category);
  const alt = SEO.generateAlt(product);
  const cartQty = Cart.getQuantity(product.id);

  // SEO: мета-теги и schema.org
  SEO.updateMetaTags(product);

  const productSchema = SEO.generateProductSchema(product, categoryName);
  const schemaScript = SEO.injectSchema(productSchema);
  schemaScript.dataset.seoSchema = 'product';

  // Хлебные крошки
  document.getElementById('breadcrumb-category').textContent = categoryName;
  document.getElementById('breadcrumb-category').href = `index.html#category-${product.category}`;
  document.getElementById('breadcrumb-product').textContent = product.name;

  // Рендер карточки товара
  const cartControlHtml = cartQty > 0
    ? `
      <div class="qty-control" id="detail-qty-control" data-product-id="${product.id}">
        <button type="button" class="qty-control__btn" data-action="decrease" aria-label="Уменьшить">−</button>
        <span class="qty-control__value" id="detail-qty">${cartQty}</span>
        <button type="button" class="qty-control__btn" data-action="increase" aria-label="Увеличить">+</button>
      </div>
    `
    : `<button type="button" class="btn btn--primary" id="detail-add-btn">Добавить в корзину</button>`;

  detailEl.innerHTML = `
    <div class="product-detail__inner">
      <div class="product-detail__image">
        <img src="${product.image}" alt="${alt}" width="600" height="400">
      </div>
      <div class="product-detail__info">
        <span class="product-detail__category">${categoryName}</span>
        <h1 class="product-detail__name">${product.name}</h1>
        <p class="product-detail__unit">${product.unit}</p>
        ${Products.renderRating(product.rating)}
        <p class="product-detail__description">${product.description}</p>
        <div class="product-detail__price-row">
          <span class="product-detail__price">${Products.formatPrice(product.price)}</span>
        </div>
        <div class="product-detail__actions" id="detail-actions">
          ${cartControlHtml}
        </div>
      </div>
    </div>
  `;

  bindDetailCartEvents(product);

  // Блок рецептов
  if (product.recipes && product.recipes.length > 0) {
    recipesSection.hidden = false;
    document.getElementById('recipes-title').textContent =
      `Рецепты с ${product.name.toLowerCase()}`;

    recipesGrid.innerHTML = product.recipes.map(recipe => `
      <article class="recipe-card">
        <h3 class="recipe-card__title">${recipe.name}</h3>
        <p class="recipe-card__description">${recipe.description}</p>
        <div class="recipe-card__ingredients">
          <strong>Ингредиенты:</strong>
          ${recipe.ingredients.join(', ')}
        </div>
      </article>
    `).join('');

    // Schema.org для рецептов
    product.recipes.forEach(recipe => {
      const recipeSchema = SEO.generateRecipeSchema(recipe, product);
      const script = SEO.injectSchema(recipeSchema);
      script.dataset.seoSchema = 'recipe';
    });
  }

  // Обновление UI при изменении корзины
  window.addEventListener('cart-updated', () => updateDetailCartUI(product));
});

/** Привязка событий корзины на странице товара */
function bindDetailCartEvents(product) {
  document.getElementById('detail-add-btn')?.addEventListener('click', () => {
    Cart.add(product.id);
  });

  const control = document.getElementById('detail-qty-control');
  if (control) {
    control.querySelector('[data-action="decrease"]')?.addEventListener('click', () => {
      Cart.decrease(product.id);
    });
    control.querySelector('[data-action="increase"]')?.addEventListener('click', () => {
      Cart.add(product.id);
    });
  }
}

/** Обновление кнопки/счётчика на странице товара */
function updateDetailCartUI(product) {
  const actionsEl = document.getElementById('detail-actions');
  if (!actionsEl) return;

  const qty = Cart.getQuantity(product.id);

  if (qty > 0) {
    actionsEl.innerHTML = `
      <div class="qty-control" id="detail-qty-control" data-product-id="${product.id}">
        <button type="button" class="qty-control__btn" data-action="decrease" aria-label="Уменьшить">−</button>
        <span class="qty-control__value" id="detail-qty">${qty}</span>
        <button type="button" class="qty-control__btn" data-action="increase" aria-label="Увеличить">+</button>
      </div>
    `;
  } else {
    actionsEl.innerHTML = `<button type="button" class="btn btn--primary" id="detail-add-btn">Добавить в корзину</button>`;
  }

  bindDetailCartEvents(product);
}
