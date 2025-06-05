import { ProductService, Producto } from '../supabase/product.service';
import { CategoryService } from '../supabase/category.service';

export interface AIProductQuery {
  query: string;
  filters?: {
    category?: string;
    maxPrice?: number;
    minPrice?: number;
    hasWarnings?: boolean;
    isOnOffer?: boolean;
    brand?: string;
  };
  limit?: number;
}

export interface AIProductResponse {
  products: Producto[];
  summary: {
    total: number;
    categories: string[];
    priceRange: { min: number; max: number };
    onOfferCount: number;
    withWarningsCount: number;
  };
  suggestions?: string[];
}

export const AIProductService = {
  /**
   * Busca productos y genera información estructurada para la IA
   */
  async searchProductsForAI(query: AIProductQuery): Promise<AIProductResponse> {
    try {
      // Asegurarse de que la consulta no esté vacía
      if (!query.query || query.query.trim() === '') {
        query.query = 'productos';
      }
      
      const products = await ProductService.searchProductsForAI(
        query.query,
        query.filters
      );

      // Aplicar filtros adicionales
      let filteredProducts = products;

      if (query.filters?.minPrice) {
        filteredProducts = filteredProducts.filter(p => {
          const price = parseFloat(p.price_current || '0');
          return price >= query.filters!.minPrice!;
        });
      }

      if (query.filters?.brand) {
        filteredProducts = filteredProducts.filter(p => 
          p.brand_name?.toLowerCase().includes(query.filters!.brand!.toLowerCase())
        );
      }

      // Si no hay productos encontrados, intentar buscar por categoría
      if (filteredProducts.length === 0 && !query.filters?.category) {
        try {
          // Intentar buscar como categoría
          const categoryResponse = await this.getProductsByCategoryForAI(query.query);
          if (categoryResponse.products.length > 0) {
            return categoryResponse;
          }
        } catch (error) {
          console.error('Error al intentar buscar por categoría:', error);
          // Continuar con el flujo normal si falla la búsqueda por categoría
        }
      }

      // Limitar resultados
      if (query.limit) {
        filteredProducts = filteredProducts.slice(0, query.limit);
      }

      // Generar resumen
      const summary = this.generateSummary(filteredProducts);

      // Generar sugerencias
      const suggestions = this.generateSuggestions(query, filteredProducts);

      return {
        products: filteredProducts,
        summary,
        suggestions
      };
    } catch (error) {
      console.error('Error searching products for AI:', error);
      throw error;
    }
  },

  /**
   * Obtiene información detallada de un producto para la IA
   */
  async getProductDetailsForAI(ean: string): Promise<string> {
    try {
      const product = await ProductService.getProductByEan(ean);
      
      if (!product) {
        return 'Producto no encontrado.';
      }

      let details = `**${product.nombre_producto || product.name_vtex || product.name_okto}**\n\n`;
      
      if (product.marca || product.brand_name) {
        details += `🏷️ **Marca:** ${product.marca || product.brand_name}\n`;
      }

      if (product.precio || product.price_current) {
        const price = product.precio || parseFloat(product.price_current || '0');
        details += `💰 **Precio:** $${price.toLocaleString('es-CL')}\n`;
      }

      if (product.categoria || product.category_name) {
        details += `📂 **Categoría:** ${product.categoria || product.category_name}\n`;
      }

      if (product.descripcion || product.description_short_vtex) {
        details += `📄 **Descripción:** ${product.descripcion || product.description_short_vtex}\n`;
      }

      if (product.peso_gramos || product.size_value_okto) {
        const weight = product.peso_gramos || product.size_value_okto;
        const unit = product.size_unit_okto || 'g';
        details += `⚖️ **Peso/Tamaño:** ${weight}${unit}\n`;
      }

      if (product.en_oferta || product.is_in_offer) {
        details += `🔥 **En oferta:** Sí\n`;
        if (product.saving_text) {
          details += `💸 **Ahorro:** ${product.saving_text}\n`;
        }
      }

      if (product.warnings && product.warnings.length > 0) {
        details += `⚠️ **Sellos de advertencia:**\n`;
        product.warnings.forEach(warning => {
          details += `   • ${warning.description || warning.warning_code}\n`;
        });
      }

      if (product.ingredients && product.ingredients.length > 0) {
        details += `🧪 **Ingredientes:** ${product.ingredients.slice(0, 5).join(', ')}`;
        if (product.ingredients.length > 5) {
          details += ` y ${product.ingredients.length - 5} más`;
        }
        details += '\n';
      }

      if (product.allergens && product.allergens.length > 0) {
        details += `🚨 **Alérgenos:** ${product.allergens.join(', ')}\n`;
      }

      return details;
    } catch (error) {
      console.error('Error getting product details for AI:', error);
      return 'Error al obtener información del producto.';
    }
  },

  /**
   * Convierte productos a texto estructurado para la IA
   */
  formatProductsForAI(products: Producto[]): string {
    if (products.length === 0) {
      return 'No se encontraron productos que coincidan con tu búsqueda.';
    }

    let response = `Encontré **${products.length} productos**:\n\n`;

    products.forEach((product, index) => {
      response += `${index + 1}. **${product.nombre_producto || product.name_vtex || product.name_okto}**\n`;
      
      if (product.marca || product.brand_name) {
        response += `   🏷️ Marca: ${product.marca || product.brand_name}\n`;
      }

      if (product.precio || product.price_current) {
        const price = product.precio || parseFloat(product.price_current || '0');
        response += `   💰 Precio: $${price.toLocaleString('es-CL')}`;
        
        if (product.en_oferta || product.is_in_offer) {
          response += ` 🔥 **¡En oferta!**`;
          if (product.saving_text) {
            response += ` (${product.saving_text})`;
          }
        }
        response += '\n';
      }

      if (product.categoria || product.category_name) {
        response += `   📂 Categoría: ${product.categoria || product.category_name}\n`;
      }

      if (product.warnings && product.warnings.length > 0) {
        response += `   ⚠️ Sellos: ${product.warnings.map(w => w.description || w.warning_code).join(', ')}\n`;
      }

      response += '\n';
    });

    return response;
  },
  /**
   * Genera un resumen de los productos encontrados
   */
  generateSummary(products: Producto[]): AIProductResponse['summary'] {
    const prices = products
      .map(p => parseFloat(p.price_current || p.precio?.toString() || '0'))
      .filter(price => price > 0);

    const categories = [...new Set(products
      .map(p => p.categoria || p.category_name)
      .filter((cat): cat is string => Boolean(cat))
    )];
    
    const onOfferCount = products.filter(p => p.en_oferta || p.is_in_offer).length;
    const withWarningsCount = products.filter(p => p.warnings && p.warnings.length > 0).length;

    return {
      total: products.length,
      categories,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      onOfferCount,
      withWarningsCount
    };
  },

  /**
   * Genera sugerencias basadas en la búsqueda
   */
  generateSuggestions(query: AIProductQuery, products: Producto[]): string[] {
    const suggestions: string[] = [];

    // Si no hay productos, sugerir categorías populares
    if (products.length === 0) {
      return [
        "Prueba buscar en categorías populares como 'Aceitunas', 'Galletas' o 'Pastas'",
        "Intenta con términos más generales",
        "Revisa la ortografía de tu búsqueda"
      ];
    }

    // Sugerencias basadas en ofertas
    const onOfferProducts = products.filter(p => p.en_oferta || p.is_in_offer);
    if (onOfferProducts.length > 0) {
      suggestions.push(`Hay ${onOfferProducts.length} productos en oferta que podrían interesarte`);
    }

    // Sugerencias basadas en categorías
    const categories = [...new Set(products.map(p => p.categoria || p.category_name).filter(Boolean))];
    if (categories.length > 1) {
      suggestions.push(`También puedes explorar estas categorías: ${categories.slice(0, 3).join(', ')}`);
    }

    // Sugerencias basadas en precios
    const prices = products
      .map(p => parseFloat(p.price_current || p.precio?.toString() || '0'))
      .filter(price => price > 0);
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const cheaperOptions = products.filter(p => {
        const price = parseFloat(p.price_current || p.precio?.toString() || '0');
        return price > 0 && price < avgPrice;
      });
      
      if (cheaperOptions.length > 0) {
        suggestions.push(`Hay ${cheaperOptions.length} opciones más económicas disponibles`);
      }
    }

    // Sugerencias sobre productos saludables
    const productsWithWarnings = products.filter(p => p.warnings && p.warnings.length > 0);
    const productsWithoutWarnings = products.filter(p => !p.warnings || p.warnings.length === 0);
    
    if (productsWithoutWarnings.length > 0 && productsWithWarnings.length > 0) {
      suggestions.push(`${productsWithoutWarnings.length} productos no tienen sellos de advertencia`);
    }

    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  },

  /**
   * Busca productos por categoría para la IA
   */
  async getProductsByCategoryForAI(categoryName: string): Promise<AIProductResponse> {
    try {
      // Buscar categoría por nombre
      const categories = await CategoryService.getAllCategories();
      
      // Mejorar la búsqueda de categorías para ser más flexible
      const normalizedSearchTerm = categoryName.toLowerCase().trim();
      
      // Primero intentar una coincidencia exacta
      let category = categories.find(c => 
        c.name.toLowerCase() === normalizedSearchTerm ||
        c.category_okto_name?.toLowerCase() === normalizedSearchTerm
      );
      
      // Si no hay coincidencia exacta, buscar coincidencias parciales
      if (!category) {
        category = categories.find(c => 
          c.name.toLowerCase().includes(normalizedSearchTerm) ||
          c.category_okto_name?.toLowerCase()?.includes(normalizedSearchTerm)
        );
      }

      if (!category) {
        // Si aún no hay coincidencia, intentar con palabras clave comunes
        const commonKeywords: {[key: string]: string[]} = {
          'aceite': ['Aceitunas Y Encurtidos'],
          'aceituna': ['Aceitunas Y Encurtidos'],
          'encurtido': ['Aceitunas Y Encurtidos'],
          'azucar': ['Azúcar'],
          'cereal': ['Cereales Y Funcionales'],
          'condimento': ['Condimentos'],
          'especia': ['Condimentos'],
          'fideo': ['Fideos Y Pastas'],
          'pasta': ['Fideos Y Pastas', 'Pastas Y Salsas', 'Pastas Frescas'],
          'fruto seco': ['Frutos Secos'],
          'galleta': ['Galletas Cóctel'],
          'ketchup': ['Ketchup'],
          'mayonesa': ['Mayonesa'],
          'mostaza': ['Mostaza'],
          'papa': ['Papas Fritas'],
          'plato': ['Platos Y Ensaladas'],
          'ensalada': ['Platos Y Ensaladas'],
          'salsa': ['Salsa Para Pastas', 'Salsa Picante', 'Salsa De Soya', 'Otras Salsas'],
          'sandwich': ['Sandwich Y Tortillas'],
          'tortilla': ['Sandwich Y Tortillas'],
          'arabe': ['Comida Árabe'],
          'thai': ['Comida Thai']
        };
        
        for (const [keyword, categoryNames] of Object.entries(commonKeywords)) {
          if (normalizedSearchTerm.includes(keyword)) {
            for (const catName of categoryNames) {
              const matchedCategory = categories.find(c => c.name === catName);
              if (matchedCategory) {
                category = matchedCategory;
                break;
              }
            }
            if (category) break;
          }
        }
      }

      if (!category) {
        return {
          products: [],
          summary: {
            total: 0,
            categories: [],
            priceRange: { min: 0, max: 0 },
            onOfferCount: 0,
            withWarningsCount: 0
          },
          suggestions: [
            `No se encontró la categoría "${categoryName}".`,
            `Intenta con términos como: ${categories.slice(0, 5).map(c => c.name).join(', ')}`,
            `O prueba con búsquedas específicas como "aceitunas", "galletas" o "pastas"`
          ]
        };
      }

      const products = await ProductService.getProductsByCategory(category.category_vtex_id);
      const summary = this.generateSummary(products);

      return {
        products,
        summary,
        suggestions: [
          `Esta categoría "${category.name}" tiene ${products.length} productos disponibles`,
          ...(summary.onOfferCount > 0 ? [`${summary.onOfferCount} productos están en oferta`] : []),
          `Puedes pedir más detalles sobre cualquier producto específico`
        ]
      };
    } catch (error) {
      console.error('Error getting products by category for AI:', error);
      throw error;
    }
  }
};
