import { Producto, ProductService } from './product.service';
import { UserService, FilterPreferences } from './user.service';

export interface ProductFilter {
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  hasWarnings?: boolean;
  isOnOffer?: boolean;
  brand?: string;
  // Filtros personalizados basados en perfil
  excludeAllergens?: boolean;
  healthyForBMI?: boolean;
  lowSodium?: boolean;
  lowSugar?: boolean;
  lowFat?: boolean;
}

export interface FilteredProductsResult {
  products: Producto[];
  appliedFilters: string[];
  recommendations: string[];
  healthScore?: number;
}

export class PersonalizedFilterService {
  /**
   * Filtra productos basándose en las preferencias del usuario
   */
  static async filterProductsForUser(
    userId: string,
    baseQuery: string,
    additionalFilters?: ProductFilter
  ): Promise<FilteredProductsResult> {
    try {
      // Obtener preferencias del usuario
      const userPreferences = await UserService.getFilterPreferences(userId);

      // Obtener productos base
      const baseProducts = await ProductService.searchProductsForAI(baseQuery, additionalFilters);

      // Aplicar filtros personalizados
      const filteredResult = this.applyPersonalizedFilters(
        baseProducts,
        userPreferences,
        additionalFilters
      );

      return filteredResult;
    } catch (error) {
      console.error('Error al filtrar productos para usuario:', error);
      // Fallback: devolver productos sin filtrar
      const baseProducts = await ProductService.searchProductsForAI(baseQuery, additionalFilters);
      return {
        products: baseProducts,
        appliedFilters: [],
        recommendations: ['Error al aplicar filtros personalizados']
      };
    }
  }

  /**
   * Aplica filtros personalizados basados en el perfil del usuario
   */
  static applyPersonalizedFilters(
    products: Producto[],
    userPreferences: FilterPreferences,
    filters?: ProductFilter
  ): FilteredProductsResult {
    let filteredProducts = [...products];
    const appliedFilters: string[] = [];
    const recommendations: string[] = [];

    // Filtro de alérgenos
    if (filters?.excludeAllergens && userPreferences.alergias && userPreferences.alergias.length > 0) {
      const originalCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        if (!product.ingredients && !product.allergens) return true;

        const productAllergens = product.allergens || [];
        const productIngredients = product.ingredients || [];

        return !userPreferences.alergias!.some((allergen: string) =>
          productAllergens.some((pa: string) => pa.toLowerCase().includes(allergen.toLowerCase())) ||
          productIngredients.some((ing: string) => ing.toLowerCase().includes(allergen.toLowerCase()))
        );
      });

      if (originalCount > filteredProducts.length) {
        appliedFilters.push(`Excluidos ${originalCount - filteredProducts.length} productos con alérgenos`);
      }
    }

    // Filtros saludables basados en IMC
    if (filters?.healthyForBMI && userPreferences.imc_category) {
      const originalCount = filteredProducts.length;

      switch (userPreferences.imc_category) {
        case 'sobrepeso':
        case 'obesidad':
          // Filtrar productos altos en sodio, azúcar y grasas
          filteredProducts = filteredProducts.filter(product => {
            if (!product.warnings) return true;

            const hasHighSodium = product.warnings.some(w =>
              w.description?.toLowerCase().includes('alto en sodio') ||
              w.warning_code?.toLowerCase().includes('sodium')
            );
            const hasHighSugar = product.warnings.some(w =>
              w.description?.toLowerCase().includes('alto en azúcar') ||
              w.warning_code?.toLowerCase().includes('sugar')
            );
            const hasHighFat = product.warnings.some(w =>
              w.description?.toLowerCase().includes('alto en gras') ||
              w.warning_code?.toLowerCase().includes('fat')
            );

            return !(hasHighSodium || hasHighSugar || hasHighFat);
          });

          if (originalCount > filteredProducts.length) {
            appliedFilters.push('Filtrados productos altos en sodio, azúcar y grasas');
            recommendations.push('Se recomiendan productos sin sellos de advertencia para un peso saludable');
          }
          break;

        case 'bajo_peso':
          // Priorizar productos con más calorías y nutrientes
          recommendations.push('Se recomiendan productos ricos en proteínas y calorías saludables');
          break;

        default:
          recommendations.push('Se recomienda mantener una dieta balanceada');
      }
    }

    // Filtro específico de bajo sodio
    if (filters?.lowSodium) {
      const originalCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        if (!product.warnings) return true;
        return !product.warnings.some(w =>
          w.description?.toLowerCase().includes('alto en sodio') ||
          w.warning_code?.toLowerCase().includes('sodium')
        );
      });

      if (originalCount > filteredProducts.length) {
        appliedFilters.push('Filtrados productos altos en sodio');
      }
    }

    // Filtro específico de bajo azúcar
    if (filters?.lowSugar) {
      const originalCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        if (!product.warnings) return true;
        return !product.warnings.some(w =>
          w.description?.toLowerCase().includes('alto en azúcar') ||
          w.warning_code?.toLowerCase().includes('sugar')
        );
      });

      if (originalCount > filteredProducts.length) {
        appliedFilters.push('Filtrados productos altos en azúcar');
      }
    }

    // Filtro específico de bajo en grasas
    if (filters?.lowFat) {
      const originalCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter(product => {
        if (!product.warnings) return true;
        return !product.warnings.some(w =>
          w.description?.toLowerCase().includes('alto en gras') ||
          w.warning_code?.toLowerCase().includes('fat')
        );
      });

      if (originalCount > filteredProducts.length) {
        appliedFilters.push('Filtrados productos altos en grasas');
      }
    }

    // Calcular puntuación de salud
    const healthScore = this.calculateHealthScore(filteredProducts, userPreferences);

    // Generar recomendaciones adicionales
    if (userPreferences.alergias && userPreferences.alergias.length > 0) {
      recommendations.push(`Recuerda revisar los ingredientes para evitar: ${userPreferences.alergias.join(', ')}`);
    }

    if (filteredProducts.length === 0 && products.length > 0) {
      recommendations.push('Los filtros son muy restrictivos. Considera ajustar tus preferencias.');
    }

    return {
      products: filteredProducts,
      appliedFilters,
      recommendations,
      healthScore
    };
  }

  /**
   * Calcula una puntuación de salud para los productos filtrados
   */
  static calculateHealthScore(products: Producto[], userPreferences: FilterPreferences): number {
    if (products.length === 0) return 0;

    let totalScore = 0;
    let scoredProducts = 0;

    products.forEach(product => {
      let productScore = 100; // Empezar con puntuación perfecta

      // Reducir puntuación por sellos de advertencia
      if (product.warnings && product.warnings.length > 0) {
        productScore -= product.warnings.length * 20;
      }

      // Aumentar puntuación si no tiene alérgenos del usuario
      if (userPreferences.alergias && userPreferences.alergias.length > 0) {
        const hasUserAllergens = userPreferences.alergias.some((allergen: string) =>
          product.allergens?.some((pa: string) => pa.toLowerCase().includes(allergen.toLowerCase())) ||
          product.ingredients?.some((ing: string) => ing.toLowerCase().includes(allergen.toLowerCase()))
        );

        if (!hasUserAllergens) {
          productScore += 10;
        } else {
          productScore -= 30;
        }
      }

      // Asegurar que la puntuación esté entre 0 y 100
      productScore = Math.max(0, Math.min(100, productScore));

      totalScore += productScore;
      scoredProducts++;
    });

    return scoredProducts > 0 ? Math.round(totalScore / scoredProducts) : 0;
  }

  /**
   * Obtiene sugerencias de productos saludables basadas en el perfil del usuario
   */
  static async getHealthySuggestions(userId: string, category?: string): Promise<FilteredProductsResult> {
    const userPreferences = await UserService.getFilterPreferences(userId);

    let baseQuery = 'productos saludables';
    if (category) {
      baseQuery = `${category} saludables`;
    }

    const filters: ProductFilter = {
      hasWarnings: false,
      excludeAllergens: true,
      healthyForBMI: true,
      lowSodium: userPreferences.imc_category === 'sobrepeso' || userPreferences.imc_category === 'obesidad',
      lowSugar: userPreferences.imc_category === 'sobrepeso' || userPreferences.imc_category === 'obesidad',
      lowFat: userPreferences.imc_category === 'sobrepeso' || userPreferences.imc_category === 'obesidad'
    };

    return this.filterProductsForUser(userId, baseQuery, filters);
  }

  /**
   * Obtiene información de recomendaciones nutricionales basadas en el IMC
   */
  static getNutritionalRecommendations(userPreferences: FilterPreferences): string[] {
    const recommendations: string[] = [];

    if (!userPreferences.imc_category) {
      recommendations.push('Completa tu peso y estatura en el perfil para obtener recomendaciones personalizadas');
      return recommendations;
    }

    switch (userPreferences.imc_category) {
      case 'bajo_peso':
        recommendations.push('Busca productos ricos en proteínas y calorías saludables');
        recommendations.push('Incluye frutos secos, aguacates y productos lácteos');
        recommendations.push('Evita productos "light" o bajos en calorías');
        break;

      case 'normal':
        recommendations.push('Mantén una dieta balanceada y variada');
        recommendations.push('Incluye frutas, verduras, proteínas y granos enteros');
        recommendations.push('Modera el consumo de productos con sellos de advertencia');
        break;

      case 'sobrepeso':
        recommendations.push('Elige productos bajos en sodio, azúcar y grasas saturadas');
        recommendations.push('Prioriza frutas, verduras y productos integrales');
        recommendations.push('Evita productos con múltiples sellos de advertencia');
        break;

      case 'obesidad':
        recommendations.push('Enfócate en productos sin sellos de advertencia');
        recommendations.push('Elige productos ricos en fibra y proteínas magras');
        recommendations.push('Limita productos procesados y azucarados');
        recommendations.push('Consulta con un profesional de la salud para un plan personalizado');
        break;
    }

    if (userPreferences.alergias && userPreferences.alergias.length > 0) {
      recommendations.push(`Siempre revisa las etiquetas para evitar: ${userPreferences.alergias.join(', ')}`);
    }

    return recommendations;
  }
}
