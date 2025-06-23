/**
 * Utilidades para procesamiento de lenguaje natural y detección de palabras similares
 */

export class NLPUtils {
  // Diccionario de productos comunes y sus variaciones
  private static productDictionary: { [key: string]: string[] } = {
    'maruchan': ['mrachan', 'marucha', 'maruchn', 'marucan', 'marucahn'],
    'aceitunas': ['aseituna', 'aseitunas', 'aceituna', 'aceytuna', 'aceitunas'],
    'mayonesa': ['mayoneza', 'mayones', 'mayonessa', 'maionesa', 'maioneza'],
    'ketchup': ['ketsup', 'catchup', 'kechup', 'ketshup', 'catsup'],
    'galletas': ['gayetas', 'galetas', 'galleta', 'gayeta', 'galeta'],
    'cereales': ['seriales', 'cereals', 'cereal', 'sereales', 'cereales'],
    'condimentos': ['condimento', 'condimetos', 'condimeto', 'condimentos'],
    'fideos': ['fideo', 'fideos', 'fidios', 'fideios', 'fideyos'],
    'papas': ['papa', 'papitas', 'papita', 'papas'],
    'fritos': ['frito', 'fritas', 'frita', 'fritos'],
    'yogurt': ['yogur', 'yogourt', 'yoghurt', 'iogurt', 'yogurt'],
    'queso': ['keso', 'qeso', 'quesos', 'kesos', 'qesos'],
    'leche': ['lehe', 'leche', 'lechee', 'lech', 'leches'],
    'pan': ['panes', 'pan', 'paan', 'pann'],
    'arroz': ['aros', 'arros', 'arroz', 'aroz'],
    'azucar': ['azukar', 'azúcar', 'azucar', 'asucar', 'azuca'],
    'sal': ['sal', 'saal', 'sall'],
    'aceite': ['aseite', 'aceyte', 'acite', 'aceite'],
    'vinagre': ['binagre', 'vinagre', 'vinagree', 'binagree'],
    'mostaza': ['mostasa', 'mostaza', 'mostasa', 'mostaza'],
    'mermelada': ['mermelada', 'mermelada', 'mermeladas', 'mermeladas'],
    'mantequilla': ['mantekilla', 'mantequilla', 'mantequila', 'mantekila'],
    'chocolate': ['chocolatte', 'chocolate', 'choclate', 'chocolat'],
    'cafe': ['café', 'cafe', 'coffe', 'coffee'],
    'te': ['té', 'te', 'tea', 'tee'],
    'agua': ['aguas', 'agua', 'agüa', 'agwa'],
    'bebida': ['bebidas', 'bebida', 'vebida', 'vebidas'],
    'jugo': ['jugos', 'jugo', 'hugo', 'hugos'],
    'soda': ['sodas', 'soda', 'gaseosa', 'gaseosas'],
    'cerveza': ['cervezas', 'cerveza', 'serveza', 'servexa'],
    'vino': ['vinos', 'vino', 'bino', 'binos'],
    'helado': ['helados', 'helado', 'elado', 'elados'],
    'dulce': ['dulces', 'dulce', 'dulse', 'dulses'],
    'caramelo': ['caramelos', 'caramelo', 'karamelo', 'karamelos'],
    'chicle': ['chicles', 'chicle', 'chikle', 'chikles'],
    'snack': ['snacks', 'snack', 'snak', 'snaks'],
    'nuts': ['nueces', 'nuts', 'nut', 'nuez'],
    'almendra': ['almendras', 'almendra', 'almendras', 'almendras'],
    'mani': ['maní', 'mani', 'manies', 'manís'],
    'pasas': ['pasa', 'pasas', 'pasitas', 'pasita']
  };

  // Marcas comunes y sus variaciones
  private static brandDictionary: { [key: string]: string[] } = {
    'coca cola': ['cocacola', 'coca-cola', 'coke', 'coca', 'cocacola'],
    'pepsi': ['pepsy', 'pepsie', 'pepsi', 'pesi'],
    'nestle': ['nestlé', 'nestle', 'nestlee', 'nestlé'],
    'danone': ['danon', 'danone', 'dannon', 'danonne'],
    'soprole': ['soprolee', 'soprole', 'soprol', 'soprolee'],
    'colun': ['colún', 'colun', 'collun', 'colún'],
    'surlat': ['surlatt', 'surlat', 'surrlat', 'surlatt'],
    'lider': ['líder', 'lider', 'lideer', 'líder'],
    'jumbo': ['jumboo', 'jumbo', 'jumbbo', 'jumboo'],
    'unimarc': ['unimark', 'unimarc', 'unimarck', 'unimark'],
    'santa isabel': ['santaisabel', 'santa-isabel', 'santaizabel', 'santaisabel'],
    'tottus': ['totus', 'tottus', 'tottuss', 'totuss'],
    'acuenta': ['a cuenta', 'acuenta', 'acuentaa', 'a-cuenta']
  };

  /**
   * Calcula la distancia de Levenshtein entre dos cadenas
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Inicializar matriz
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Llenar matriz
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitución
            matrix[i][j - 1] + 1,     // inserción
            matrix[i - 1][j] + 1      // eliminación
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Calcula la similitud entre dos cadenas (0-1)
   */
  static similarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLen - distance) / maxLen;
  }

  /**
   * Encuentra la palabra más similar en el diccionario
   */
  static findSimilarWord(input: string, threshold: number = 0.6): string | null {
    const normalizedInput = input.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    let bestMatch = null;
    let bestSimilarity = 0;

    // Buscar en diccionario de productos
    for (const [correct, variations] of Object.entries(this.productDictionary)) {
      // Verificar coincidencia exacta con variaciones
      if (variations.includes(normalizedInput)) {
        return correct;
      }

      // Verificar similitud con la palabra correcta
      const similarity = this.similarity(normalizedInput, correct);
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = correct;
      }

      // Verificar similitud con variaciones
      for (const variation of variations) {
        const varSimilarity = this.similarity(normalizedInput, variation);
        if (varSimilarity > bestSimilarity && varSimilarity >= threshold) {
          bestSimilarity = varSimilarity;
          bestMatch = correct;
        }
      }
    }

    // Buscar en diccionario de marcas
    for (const [correct, variations] of Object.entries(this.brandDictionary)) {
      if (variations.includes(normalizedInput)) {
        return correct;
      }

      const similarity = this.similarity(normalizedInput, correct);
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = correct;
      }

      for (const variation of variations) {
        const varSimilarity = this.similarity(normalizedInput, variation);
        if (varSimilarity > bestSimilarity && varSimilarity >= threshold) {
          bestSimilarity = varSimilarity;
          bestMatch = correct;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Corrige múltiples palabras en un texto
   */
  static correctText(text: string): string {
    const words = text.split(/\s+/);
    const correctedWords = words.map(word => {
      const cleanWord = word.replace(/[^\w\s]/g, '');
      if (cleanWord.length < 3) return word; // No corregir palabras muy cortas
      
      const correction = this.findSimilarWord(cleanWord);
      return correction ? word.replace(cleanWord, correction) : word;
    });

    return correctedWords.join(' ');
  }
  /**
   * Extrae términos de búsqueda corregidos
   */
  static extractCorrectedSearchTerms(message: string): string {
    // Detectar si la consulta es sobre productos saludables
    const lowerMessage = message.toLowerCase();
    const isHealthyQuery = lowerMessage.includes('sin sellos') || 
                          lowerMessage.includes('sin advertencia') || 
                          lowerMessage.includes('saludable') || 
                          lowerMessage.includes('saludables') ||
                          lowerMessage.includes('libre de sellos') ||
                          lowerMessage.includes('no tienen sellos') ||
                          lowerMessage.includes('sin etiquetas') ||
                          lowerMessage.includes('productos sanos') ||
                          lowerMessage.includes('productos naturales');

    // Si es una consulta sobre productos saludables, no incluir términos relacionados con sellos
    if (isHealthyQuery) {
      // Remover palabras específicas de sellos y términos de búsqueda
      const removeWords = [
        'buscar', 'busca', 'busco', 'encuentro', 'encuentra', 'producto', 'productos',
        'quiero', 'necesito', 'me puedes', 'puedes', 'mostrar', 'ver', 'dame',
        'dime', 'cual', 'cuales', 'donde', 'como', 'que', 'hay', 'tiene',
        'tengo', 'para', 'por', 'con', 'sin', 'de', 'del', 'la', 'las',
        'el', 'los', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero',
        // Palabras específicas de sellos que no deben incluirse en la búsqueda
        'sellos', 'advertencia', 'advertencias', 'etiquetas', 'libre', 'sanos', 'naturales'
      ];

      let cleanedMessage = message.toLowerCase();
      
      // Remover palabras comunes y términos relacionados con sellos
      removeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleanedMessage = cleanedMessage.replace(regex, '').trim();
      });

      // Si después de limpiar queda vacío, devolver una cadena vacía para búsqueda general
      if (!cleanedMessage || cleanedMessage.trim().length === 0) {
        return '';
      }

      // Corregir el texto limpio
      const correctedText = this.correctText(cleanedMessage);
      return correctedText.trim();
    }

    // Para consultas normales, usar el método original
    const removeWords = [
      'buscar', 'busca', 'busco', 'encuentro', 'encuentra', 'producto', 'productos',
      'quiero', 'necesito', 'me puedes', 'puedes', 'mostrar', 'ver', 'dame',
      'dime', 'cual', 'cuales', 'donde', 'como', 'que', 'hay', 'tiene',
      'tengo', 'para', 'por', 'con', 'sin', 'de', 'del', 'la', 'las',
      'el', 'los', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero'
    ];

    let cleanedMessage = message.toLowerCase();
    
    // Remover palabras comunes
    removeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedMessage = cleanedMessage.replace(regex, '').trim();
    });

    // Corregir el texto limpio
    const correctedText = this.correctText(cleanedMessage);
    
    return correctedText.trim();
  }

  /**
   * Sugiere correcciones para una consulta
   */
  static suggestCorrections(query: string): string[] {
    const words = query.split(/\s+/);
    const suggestions: string[] = [];

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w\s]/g, '');
      if (cleanWord.length >= 3) {
        const correction = this.findSimilarWord(cleanWord, 0.5);
        if (correction && correction !== cleanWord.toLowerCase()) {
          suggestions.push(`¿Quisiste decir "${correction}" en lugar de "${cleanWord}"?`);
        }
      }
    });

    return suggestions;
  }
}

