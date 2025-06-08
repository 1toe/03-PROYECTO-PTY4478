import { Producto } from '../services/supabase/product.service';

/**
 * Filtra productos únicos basándose en su EAN
 * @param products Array de productos
 * @returns Array de productos únicos
 */
export const filterUniqueProducts = (products: Producto[]): Producto[] => {
  const uniqueProducts: Producto[] = [];
  const seenEans = new Set<string>();

  for (const product of products) {
    if (product.ean && !seenEans.has(product.ean)) {
      uniqueProducts.push(product);
      seenEans.add(product.ean);
    } else if (!product.ean) {
      // Si no tiene EAN, incluir el producto de todas formas
      uniqueProducts.push(product);
    }
  }

  return uniqueProducts;
};