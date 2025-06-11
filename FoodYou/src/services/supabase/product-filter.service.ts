import { Producto } from './product.service';
import { UserService, FilterPreferences } from './user.service';
import supabase from '../../utils/supabase';

export interface FilterOptions {
  excludeAllergens?: boolean;
  maxSodium?: number;
  maxSugar?: number;
  maxFat?: number;
  minProtein?: number;
  excludeHighCalories?: boolean;
  includeRecommendations?: boolean;
}

export interface ProductRecommendation {
  product: Producto;
  score: number;
  reasons: string[];
  warnings: string[];
}

export const ProductFilterService = {
  /**
   * Filtra productos basándose en el perfil del usuario
   */
  async filterProductsForUser(
    products: Producto[], 
    userId: string, 
    options: FilterOptions = {}
  ): Promise<ProductRecommendation[]> {
    try {
      const preferences = await UserService.getFilterPreferences(userId);
      const recommendations: ProductRecommendation[] = [];

      for (const product of products) {
        const recommendation = await this.evaluateProduct(product, preferences, options);
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      // Ordenar por score descendente
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error al filtrar productos para el usuario:', error);
      return products.map(product => ({
        product,
        score: 50, // Score neutral
        reasons: [],
        warnings: []
      }));
    }
  },

  /**
   * Evalúa un producto individual basándose en las preferencias del usuario
   */
  async evaluateProduct(
    product: Producto,
    preferences: FilterPreferences,
    options: FilterOptions
  ): Promise<ProductRecommendation | null> {
    let score = 50; // Score base
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Verificar alérgenos
    if (options.excludeAllergens && preferences.alergias && preferences.alergias.length > 0) {
      const allergenConflict = await this.checkAllergens(product, preferences.alergias);
      if (allergenConflict.hasConflict) {
        warnings.push(`Contiene alérgenos: ${allergenConflict.allergens.join(', ')}`);
        score -= 30;
        
        // Si es muy crítico, excluir completamente
        if (allergenConflict.allergens.length > 1) {
          return null;
        }
      } else {
        reasons.push('Sin alérgenos conocidos');
        score += 10;
      }
    }

    // Evaluación basada en sellos de advertencia y BMI
    if (preferences.imc_category && product.warnings) {
      const warningScore = this.evaluateWarningsForBMI(product.warnings, preferences.imc_category);
      score += warningScore.scoreChange;
      reasons.push(...warningScore.reasons);
      warnings.push(...warningScore.warnings);
    }

    // Verificar si está en oferta
    if (product.en_oferta || product.is_in_offer) {
      score += 15;
      reasons.push('Producto en oferta');
    }

    // Verificar precio (productos más económicos tienen mejor score)
    const price = parseFloat(product.price_current || '0');
    if (price > 0) {
      if (price < 1000) {
        score += 5;
        reasons.push('Precio económico');
      } else if (price > 5000) {
        score -= 5;
        warnings.push('Producto de precio alto');
      }
    }

    // Score mínimo para considerar el producto
    if (score < 20) {
      return null;
    }

    return {
      product,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      warnings
    };
  },

  /**
   * Verifica alérgenos del producto
   */
  async checkAllergens(product: Producto, userAllergens: string[]): Promise<{
    hasConflict: boolean;
    allergens: string[];
  }> {
    const productAllergens: string[] = [];
    
    // Verificar alérgenos conocidos en ingredientes y alertas
    if (product.allergens) {
      productAllergens.push(...product.allergens);
    }

    // Verificar en ingredientes comunes
    if (product.ingredients) {
      const commonAllergens = ['gluten', 'lactosa', 'huevo', 'nueces', 'maní', 'soja', 'pescado', 'mariscos'];
      
      for (const ingredient of product.ingredients) {
        const ingredientLower = ingredient.toLowerCase();
        for (const allergen of commonAllergens) {
          if (ingredientLower.includes(allergen)) {
            productAllergens.push(allergen);
          }
        }
      }
    }

    const conflictingAllergens = userAllergens.filter(userAllergen =>
      productAllergens.some(productAllergen =>
        productAllergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
        userAllergen.toLowerCase().includes(productAllergen.toLowerCase())
      )
    );

    return {
      hasConflict: conflictingAllergens.length > 0,
      allergens: conflictingAllergens
    };
  },

  /**
   * Evalúa sellos de advertencia basándose en el IMC del usuario
   */
  evaluateWarningsForBMI(warnings: any[], bmcCategory: string): {
    scoreChange: number;
    reasons: string[];
    warnings: string[];
  } {
    let scoreChange = 0;
    const reasons: string[] = [];
    const warningMessages: string[] = [];

    const hasHighSodium = warnings.some(w => 
      w.warning_code?.includes('ALTO_SODIO') || 
      w.description?.toLowerCase().includes('alto en sodio')
    );
    
    const hasHighSugar = warnings.some(w => 
      w.warning_code?.includes('ALTO_AZUCAR') || 
      w.description?.toLowerCase().includes('alto en azúcar')
    );
    
    const hasHighFat = warnings.some(w => 
      w.warning_code?.includes('ALTO_GRASA') || 
      w.description?.toLowerCase().includes('alto en grasa')
    );

    const hasHighCalories = warnings.some(w => 
      w.warning_code?.includes('ALTO_CALORIA') || 
      w.description?.toLowerCase().includes('alto en calorías')
    );

    // Recomendaciones específicas según IMC
    switch (bmcCategory) {
      case 'bajo_peso':
        // Para bajo peso, productos con más calorías pueden ser beneficiosos
        if (!hasHighCalories) {
          scoreChange += 5;
          reasons.push('Adecuado para aumentar peso');
        }
        break;
        
      case 'sobrepeso':
      case 'obesidad':
        // Para sobrepeso/obesidad, evitar productos altos en azúcar, grasa y calorías
        if (hasHighSugar) {
          scoreChange -= 15;
          warningMessages.push('Alto en azúcar - no recomendado para control de peso');
        }
        if (hasHighFat) {
          scoreChange -= 10;
          warningMessages.push('Alto en grasa saturada');
        }
        if (hasHighCalories) {
          scoreChange -= 12;
          warningMessages.push('Alto en calorías');
        }
        if (hasHighSodium) {
          scoreChange -= 8;
          warningMessages.push('Alto en sodio');
        }
        
        // Bonus si no tiene sellos
        if (warnings.length === 0) {
          scoreChange += 20;
          reasons.push('Sin sellos de advertencia - ideal para control de peso');
        }
        break;
        
      case 'normal':
        // Para peso normal, ligera penalización por sellos múltiples
        if (warnings.length >= 2) {
          scoreChange -= 5;
          warningMessages.push('Múltiples sellos de advertencia');
        } else if (warnings.length === 0) {
          scoreChange += 10;
          reasons.push('Producto saludable sin sellos');
        }
        break;
    }

    // Penalización general por alto sodio (importante para todos)
    if (hasHighSodium) {
      scoreChange -= 5;
      warningMessages.push('Alto contenido de sodio');
    }

    return {
      scoreChange,
      reasons,
      warnings: warningMessages
    };
  },

  /**
   * Obtiene recomendaciones de productos para un usuario
   */
  async getProductRecommendations(
    userId: string,
    searchQuery?: string,
    categoryId?: string,
    limit: number = 20
  ): Promise<ProductRecommendation[]> {
    try {
      // Obtener productos base
      let products: Producto[] = [];
      
      if (searchQuery) {
        const { ProductService } = await import('./product.service');
        products = await ProductService.searchProductsForAI(searchQuery, {
          category: categoryId,
          hasWarnings: false // Priorizar productos sin sellos
        });
      } else if (categoryId) {
        const { ProductService } = await import('./product.service');
        products = await ProductService.getProductsByCategory(categoryId, limit);
      } else {
        const { ProductService } = await import('./product.service');
        products = await ProductService.searchProductsForAI('', {
          isOnOffer: true, // Priorizar ofertas
          hasWarnings: false
        });
      }

      // Filtrar según perfil del usuario
      const recommendations = await this.filterProductsForUser(products, userId, {
        excludeAllergens: true,
        includeRecommendations: true
      });

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener recomendaciones:', error);
      return [];
    }
  }
};
