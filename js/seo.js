/**
 * seo.js — генерация SEO-метаданных и структурированных данных
 */

const SEO = {
  /** Обрезка текста до указанной длины */
  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3).trim() + '...';
  },

  /** Генерация SEO-заголовка (макс. 60 символов) */
  generateTitle(product) {
    const title = `${product.name} — купить в СвежМаркет`;
    return this.truncate(title, 60);
  },

  /** Генерация мета-описания (макс. 160 символов) */
  generateDescription(product) {
    const priceText = `${product.price} ₽`;
    const desc = `Купить ${product.name} (${product.unit}) за ${priceText}. ${product.description}`;
    return this.truncate(desc, 160);
  },

  /** Генерация alt-текста для изображения */
  generateAlt(product) {
    return `${product.name} — ${product.unit}, фото товара в интернет-магазине СвежМаркет`;
  },

  /** Обновление meta-тегов на странице */
  updateMetaTags(product) {
    document.title = this.generateTitle(product);

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = this.generateDescription(product);
  },

  /** Schema.org Product */
  generateProductSchema(product, categoryName) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      sku: String(product.id),
      category: categoryName,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'СвежМаркет'
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        bestRating: 5,
        worstRating: 1,
        ratingCount: Math.floor(product.rating * 20)
      }
    };
  },

  /** Schema.org Recipe */
  generateRecipeSchema(recipe, product) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: recipe.name,
      description: recipe.description,
      recipeIngredient: recipe.ingredients,
      author: {
        '@type': 'Organization',
        name: 'СвежМаркет'
      },
      keywords: product.name
    };
  },

  /** Вставка JSON-LD в head */
  injectSchema(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return script;
  },

  /** Удаление ранее вставленных schema-скриптов */
  clearSchemas() {
    document.querySelectorAll('script[data-seo-schema]').forEach(el => el.remove());
  }
};
