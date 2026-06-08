# Guía de Arquitectura y Estructura — El Corcho Guardado

¡Bienvenido a la documentación técnica de **El Corcho Guardado**! Esta guía te servirá de mapa para entender cómo se conectan las piezas de tu PWA en Next.js y Firebase, dónde reside cada funcionalidad y cómo realizar cambios manuales de forma segura.

---

## 1. Arquitectura General y Flujo de Datos

La aplicación está construida sobre **Next.js 15+ (App Router)** usando el enfoque de **Exportación Estática (SSG)**. Todo el código del frontend se compila a archivos estáticos que se sirven de forma ultra-rápida desde **Firebase Hosting**.

La base de datos, la autenticación y el almacenamiento son gestionados directamente desde el navegador del usuario (cliente) a través de la SDK de Firebase.

```
+-------------------------------------------------------------+
|                     Navegador del Usuario                   |
+-------------------------------------------------------------+
       |                         |                     |
       v                         v                     v
[AuthContext.tsx]         [Firebase Firestore]  [Firebase Storage]
 (Estado de Sesión)        (Base de datos)       (Fotos de Vinos)
       |                         |                     |
       v                         |                     |
(Muestra/oculta botones          |                     |
 según correo autorizado)        v                     v
                          [Reglas de Firebase en la Nube]
                          (Filtro de seguridad definitivo)
```

---

## 2. Mapa de Directorios y Archivos

Aquí se detalla dónde reside cada componente del proyecto:

```text
ElCorchoGuardado/
├── .github/workflows/          # Acciones automáticas de GitHub (CI/CD) para Firebase
├── public/                     # Recursos estáticos globales (Logo, Manifest, Favicon)
├── src/
│   ├── app/                    # Directorio de rutas de Next.js (App Router)
│   │   ├── add/
│   │   │   └── page.tsx        # Formulario para registrar un nuevo vino
│   │   ├── login/
│   │   │   └── page.tsx        # Página de acceso (Email/Password y Google)
│   │   ├── globals.css         # Todo el diseño visual, variables y responsive
│   │   ├── layout.tsx          # Estructura HTML base y barra de navegación
│   │   └── page.tsx            # Vitrina o catálogo principal (Filtros y búsquedas)
│   ├── components/             # Componentes modulares reutilizables
│   │   ├── WineCard.tsx        # Tarjeta individual en la cuadrícula de la vitrina
│   │   └── WineDetailsModal.tsx# Modal flotante con detalles y visor de fotos
│   ├── context/
│   │   └── AuthContext.tsx     # Contexto global de sesión y control de permisos
│   └── lib/
│       └── firebase.ts         # Inicialización del cliente de Firebase
├── firebase.json               # Configuración del Hosting de Firebase
├── next.config.ts              # Configuración de compilación Next.js (Static Export)
└── package.json                # Lista de librerías y dependencias
```

---

## 3. Interfaces de Datos y Contratos (TypeScript)

Para que el flujo de datos sea consistente desde que guardas un vino hasta que lo visualizas, la interfaz del modelo `Wine` define la estructura del documento en Firestore.

### Interfaz del Modelo `Wine`
Definida de manera idéntica en `src/app/page.tsx` y `src/components/WineDetailsModal.tsx`:

```typescript
interface Wine {
  id: string;          // ID único generado automáticamente por Firestore
  name: string;        // Nombre del vino (obligatorio)
  type: string;        // Tipo: 'Tinto', 'Blanco', 'Rosado', 'Cava', 'Champagne', 'Naranja', 'Otro'
  winery: string;      // Bodega o Denominación de Origen
  restaurant: string;  // Restaurante donde se probó
  grapes?: string;     // Variedades de uva descritas
  rating: number;      // Puntuación de 1 a 5 estrellas
  date: string;        // Fecha en formato YYYY-MM-DD
  notes: string;       // Comentarios personales
  imageUrl?: string;   // URL de la primera imagen (retrocompatibilidad)
  imagePath?: string;  // Ruta en Firebase Storage de la primera imagen
  imageUrls?: string[];// Lista de URLs de todas las fotos asociadas
  imagePaths?: string[];// Lista de rutas en Storage para limpieza al borrar
}
```

### Propiedades de la Sesión (`AuthContext`)
La aplicación comparte el estado de sesión de forma global. Cualquier componente puede consumir esta interfaz:

```typescript
interface AuthContextType {
  user: User | null;         // Objeto usuario de Firebase Auth
  loading: boolean;          // true mientras Firebase recupera la sesión
  isAuthorized: boolean;     // true si el usuario logueado está en la lista de administradores
}
```

---

## 4. Manual de Modificaciones Rápidas

A continuación te indico cómo modificar a mano las partes más comunes:

### A. ¿Cómo añadir un nuevo tipo de vino?
Si quieres añadir un nuevo tipo de vino (por ejemplo, "Rosado Dulce"):

1. **En `src/app/add/page.tsx` (Formulario)**:
   Modifica la constante `WINE_TYPES` para incluirlo en la lista desplegable:
   ```typescript
   const WINE_TYPES = ["Tinto", "Blanco", "Rosado", "Cava", "Champagne", "Naranja", "Rosado Dulce", "Otro"];
   ```
2. **En `src/app/page.tsx` (Filtros)**:
   Modifica la constante `WINE_TYPES` para que aparezca en el filtro rápido de la vitrina:
   ```typescript
   const WINE_TYPES = ["Todos", "Tinto", "Blanco", "Rosado", "Cava", "Champagne", "Naranja", "Rosado Dulce", "Otro"];
   ```
3. **En `src/app/globals.css` (Diseño de la etiqueta)**:
   Añade el color para la etiqueta del tipo de vino. Busca `.wine-card-badge` y añade una nueva clase:
   ```css
   .wine-card-badge.rosado-dulce {
     background: rgba(244, 143, 177, 0.15); /* Color de fondo traslúcido */
     color: #f48fb1;                        /* Color de texto rosado */
     border: 1px solid rgba(244, 143, 177, 0.3);
   }
   ```
   *(Nota: La clase CSS se asocia automáticamente convirtiendo el tipo de vino a minúsculas y reemplazando espacios con guiones si es necesario).*

### B. ¿Cómo cambiar los correos autorizados localmente?
En tu máquina local, los correos que tienen permiso para escribir se leen del archivo `.env.local` (este archivo no se sube a GitHub por seguridad):
```ini
NEXT_PUBLIC_AUTHORIZED_EMAILS=correo1@gmail.com,correo2@gmail.com
```

### C. ¿Cómo cambiar el tema de colores visuales (CSS)?
Todo el aspecto visual premium reside en las variables CSS definidas en la parte superior de `src/app/globals.css`. Puedes modificar los colores del tema editando estos valores hexadecimales:
```css
:root {
  --bg-color: #0b0708;       /* Fondo oscuro profundo */
  --wine-color: #722f37;     /* Color vino tinto primario */
  --cork-base: #c29b70;      /* Color corcho */
  --text-color: #f3eff0;     /* Texto claro */
  --star-color: #d4af37;     /* Color de las estrellas de valoración */
}
```

---

## 5. Ciclo de Publicación y Despliegue Manual

Dado que configuraste los flujos de GitHub, cada vez que hagas un `git push` de tus cambios a la rama `main` de tu repositorio de GitHub, se compilará y desplegará la web sola. 

Sin embargo, si en algún momento deseas hacer un despliegue **manual** directo desde tu consola local sin pasar por GitHub:

1. Compila la aplicación estática en tu ordenador:
   ```bash
   npm run build
   ```
2. Sube la carpeta `out/` generada a Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
