# Especificaciones del Proyecto

## Versión 1

### Descripción

Aplicación móvil desarrollada con Ionic y React que permite a los usuarios explorar y gestionar información nutricional de alimentos, basada en la Ley 20.606 de composición nutricional y publicidad de alimentos.

### Tecnologías Utilizadas

- **Framework:** Ionic con React.
- **Librerías:** React Router, Capacitor.
- **Herramientas de Construcción:** Vite.
- **Lenguaje:** TypeScript.
- **Pruebas:** Cypress para pruebas E2E, Vitest para pruebas unitarias.
- **Estilo:** CSS personalizado con soporte para temas oscuros y claros.

### Funcionalidades Principales

1. **Exploración de Alimentos:**
   - Visualización de información nutricional.
   - Identificación de sellos "ALTO EN" según la Ley 20.606.
2. **Filtros de Evaluación:**
   - Filtro por adición de ingredientes (azúcar, grasas, sodio).
   - Comparación de nutrientes contra límites establecidos.
3. **Modo Oscuro:**
   - Soporte para temas claros y oscuros.
4. **Compatibilidad Multiplataforma:**
   - Disponible para navegadores modernos y dispositivos móviles.

### Configuración del Proyecto

- **Archivo de configuración principal:** `capacitor.config.ts`.
- **Configuración de Vite:** `vite.config.ts`.
- **Compatibilidad de Navegadores:** Definida en `.browserslistrc`.

### Dependencias Clave

- `@ionic/react`: ^8.5.0
- `react`: 19.0.0
- `typescript`: ^5.1.6
- `cypress`: ^13.5.0
- `vitest`: ^0.34.6

### Scripts Disponibles

- `dev`: Inicia el servidor de desarrollo.
- `build`: Compila el proyecto para producción.
- `preview`: Previsualiza la aplicación compilada.
- `test.e2e`: Ejecuta pruebas E2E con Cypress.
- `test.unit`: Ejecuta pruebas unitarias con Vitest.
- `lint`: Ejecuta ESLint para verificar el código.

### Estructura del Proyecto

- **`src/`**: Contiene el código fuente principal.
- **`public/`**: Archivos públicos como `index.html` y `manifest.json`.
- **`cypress/`**: Configuración y pruebas E2E.
- **`theme/`**: Variables y estilos CSS personalizados.

### Configuración de Pruebas

- **E2E:** Cypress configurado en `cypress.config.ts`.
- **Unitarias:** Vitest configurado en `vite.config.ts`.

### Información Adicional

- **Nombre del Proyecto:** FoodYou.
- **Versión Inicial:** 0.0.1.
- **Tipo de Proyecto:** Módulo ES.
