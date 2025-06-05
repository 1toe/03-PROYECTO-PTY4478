(function() {
    const ldJsonScript = document.querySelector('script[type="application/ld+json"]');
    if (ldJsonScript) {
        try {
            const jsonData = JSON.parse(ldJsonScript.textContent);
            if (jsonData && jsonData["@graph"]) {
                const products = jsonData["@graph"].filter(item => item["@type"] === "Product");
                if (products.length > 0) return products;
            }
            if (jsonData && jsonData["@type"] === "ItemList") {
                 return jsonData.itemListElement.map(item => item.item);
            }
             if (Array.isArray(jsonData)) {
                const products = jsonData.filter(item => item["@type"] === "Product");
                 if (products.length > 0) return products;
            }
            if (jsonData && jsonData["@type"] === "Product") {
                return [jsonData];
            }
        } catch (e) { /* console.error("Error parsing LD+JSON:", e); */ }
    }

    const productData = [];
    let potentialProductContainers = document.querySelectorAll(
        'div[class*="product"], article[class*="product"], li[class*="product"], ' +
        'div[data-sku], div[data-product-id], ' +
        '[class*="ProductCard_container"], [class*="ShelfProduct_container"]'
    );

    if (potentialProductContainers.length === 0) {
        potentialProductContainers = document.querySelectorAll('div, article, li');
    }
    
    Array.from(potentialProductContainers).forEach(el => {
        const hasImage = el.querySelector('img') !== null;
        const hasPriceText = el.innerText.includes('$');
        if (!hasImage || !hasPriceText) return;
        if (el.offsetHeight < 50 || el.offsetWidth < 50) return;
        
        const product = {};
        
        const imgElement = el.querySelector('img[alt], img[title], img');
        if (imgElement) {
            product.imageUrl = imgElement.src;
            product.imageAlt = imgElement.alt || imgElement.title || "";
        }

        let name = el.querySelector('[class*="product-name"], [class*="product-title"], [class*="Title_title"], h2, h3, h4, a[title]')?.innerText.trim();
        if (!name) {
            const nameCandidates = Array.from(el.querySelectorAll('a, span, p, div[class*="name"], div[class*="title"]'))
                .map(e => e.innerText.trim())
                .filter(t => t && t.length > 5 && !t.includes('$') && !t.match(/^\\d+\\s*g$/i) && !t.match(/^\\d+%$/) && !t.match(/kg$|unidad$/i) && !/ver m|detalles|comprar|agregar/i.test(t) );
            if (nameCandidates.length > 0) name = nameCandidates.sort((a,b) => b.length - a.length)[0];
        }
        if (!name && product.imageAlt && product.imageAlt.length > 5) name = product.imageAlt;
        product.name = name;

        product.brand = el.querySelector('[class*="product-brand"], [class*="brand-name"], [class*="Brand_brand"]')?.innerText.trim();
        
        const priceTexts = [];
        const priceElements = el.querySelectorAll('[class*="price"], [class*="Price_container"], [class*="ProductPrice_container"]');
        let elementsToSearchPrices = priceElements.length > 0 ? priceElements : el.querySelectorAll('span, div, p');
        
        elementsToSearchPrices.forEach(priceEl => {
            const text = priceEl.innerText.trim().replace(/\n/g, ' ');
            if (text.includes('$') && text.match(/\\d/)) {
                 if (!priceTexts.some(pt => pt.includes(text) || text.includes(pt))) {
                     priceTexts.push(text);
                }
            }
        });
        product.prices = priceTexts.filter(p => p.length > 0);
        
        let weight = el.querySelector('[class*="product-weight"], [class*="product-size"], [class*="ProductCard_extraInfo"], [class*="weight"], [class*="size"]')?.innerText.trim();
        if (!weight) {
            const weightCandidates = Array.from(el.querySelectorAll('span, div, p'))
                .map(e => e.innerText.trim())
                .filter(t => t && t.match(/\\d+(\\.\\d+)?\\s*(g|kg|ml|l|unidades|unidad|un|gr|cc)\\b/i));
            if (weightCandidates.length > 0) weight = weightCandidates[0];
        }
        product.weight = weight;

        product.sku = el.dataset.sku || el.dataset.productId || el.querySelector('[data-sku]')?.dataset.sku;
        const productLinkElement = el.querySelector('a[href*="/producto/"], a[href*="/product/"]');
        if (productLinkElement) product.productUrl = productLinkElement.href;

        if (product.name && product.prices && product.prices.length > 0 && product.imageUrl) {
            productData.push(product);
        }
    });

    const uniqueProducts = [];
    const seenKeys = new Set();
    for (const p of productData) {
        const key = p.productUrl || (p.name && p.imageUrl ? `${p.name}|${p.imageUrl}` : null);
        if (key && !seenKeys.has(key)) {
            uniqueProducts.push(p);
            seenKeys.add(key);
        }
    }
    
    return uniqueProducts.length > 0 ? uniqueProducts : "No se pudieron extraer productos. Se requiere inspección manual de selectores CSS o la página no contiene productos en el formato esperado.";
})();