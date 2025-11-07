# Omar Caiguan - Chatbot RAG Portfolio

Este proyecto es un chatbot inteligente construido con Next.js que utiliza un modelo RAG (Retrieval-Augmented Generation) para responder preguntas sobre mi experiencia profesional. El chatbot aprovecha los embeddings de OpenAI para realizar búsquedas semánticas en una base de datos vectorial de Supabase.

## ✨ Características Destacadas

- **🎨 Interfaz Moderna:** Pantalla de bienvenida profesional con efectos de partículas animadas
- **📱 Responsive Design:** Adaptable a diferentes dispositivos con diseño moderno
- **🤖 Arquitectura RAG:** Respuestas enriquecidas con información relevante de mi CV
- **🔍 Búsqueda Semántica:** Embeddings de OpenAI para encontrar información precisa
- **⚡ Rendimiento Optimizado:** Canvas HTML5 para animaciones fluidas a 60 FPS

## 🎯 Interfaz de Usuario

### Pantalla de Bienvenida
- **Header personalizado** con nombre y título profesional
- **Partículas animadas** con efectos de glow y trails
- **Cards interactivas** con preguntas rápidas sobre:
  - Habilidades técnicas
  - Proyectos destacados
  - Experiencia RAG
  - Trayectoria profesional

### Paleta de Colores
```css
Primary:   #2563eb  (Azul profesional)
Accent:    #3b82f6  (Azul claro)
Secondary: #64748b  (Gris azulado)
Dark BG:   #0f172a → #1e293b (gradiente)
Text:      #f1f5f9  (Texto claro)
```

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React 18)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **IA y Embeddings:** [OpenAI API](https://openai.com/)
- **Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL con pgvector)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Animaciones:** Canvas API HTML5

## 🚀 Instalación y Configuración

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- Cuenta de [OpenAI](https://platform.openai.com/) con API key
- Cuenta de [Supabase](https://supabase.com/) con proyecto creado

### 2. Clonar e Instalar

```bash
git clone <URL-del-repositorio>
cd ChatBot-Rag-Portfolio
npm install
```

### 3. Configurar Base de Datos

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor**
3. Ejecuta el contenido de `scripts/setup-cv-search.sql`

### 4. Variables de Entorno

Crea `.env.local` con:

```env
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://<tu-id>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-clave"
```

### 5. Generar Embeddings

```bash
npx tsx scripts/populate-embeddings.ts
```

### 6. Ejecutar

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) para ver el chatbot con la nueva interfaz.

## 🎨 Personalización

### Cambiar Información Personal

Edita `components/welcome-screen.tsx`:

```tsx
// Línea 164-176
<h1>Hola, soy <span className="text-blue-400">TU NOMBRE</span></h1>
<p className="text-lg text-gray-300 mb-2">TU TÍTULO</p>
<p className="text-gray-400">TU DESCRIPCIÓN PROFESIONAL</p>
```

### Preguntas Rápidas

Modifica las cards en `components/welcome-screen.tsx` (líneas 119-143):

```tsx
const quickQuestions = [
  {
    icon: <TuIcono className="w-5 h-5" />,
    title: 'Tu Título',
    description: 'Tu descripción',
    question: 'Pregunta que se enviará',
  },
  // ...
];
```

### Ajustar Partículas

```tsx
// En welcome-screen.tsx, línea 44
particlesRef.current = Array.from({ length: 25 }, () => ({
  // Cambia 25 por el número deseado (15-40 recomendado)
}));
```

## 📁 Estructura del Proyecto

```
ChatBot-Rag-Portfolio/
├── components/
│   ├── welcome-screen.tsx      # 🎨 Pantalla de bienvenida con partículas
│   ├── conversation.tsx        # 💬 Componentes de chat
│   ├── prompt-input.tsx        # 📝 Input de mensajes
│   └── ...                     # Otros componentes
├── app/
│   ├── page.tsx               # 🏠 Página principal con welcome screen
│   ├── layout.tsx             # 📄 Layout con metadata actualizada
│   ├── globals.css            # 🎨 Estilos globales
│   └── api/                   # 🔌 API endpoints
└── scripts/                   # 🛠️ Scripts de configuración
```

## 🌟 Características RAG

- **Embeddings Inteligentes:** `text-embedding-3-small` de OpenAI
- **Búsqueda Semántica:** Similitud de coseno para encontrar información relevante
- **Base Vectorial:** PostgreSQL con extensión pgvector
- **Respuestas Contextuales:** Información precisa sobre experiencia y proyectos

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube a GitHub
2. Importa en Vercel
3. Configura variables de entorno
4. ¡Listo! URL pública disponible

## 💬 API Usage

```bash
curl -X POST https://tu-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "parts": [{ "type": "text", "text": "¿Cuáles son tus habilidades?" }] }
    ]
  }'
```

## 🔧 Funcionalidades

### ✅ Implementado
- [x] Pantalla de bienvenida profesional
- [x] Partículas animadas con Canvas
- [x] Cards de preguntas rápidas
- [x] Diseño responsive
- [x] Integración completa con RAG
- [x] Metadata SEO optimizada

### 🎯 En Desarrollo
- [ ] Modo claro/oscuro
- [ ] Más opciones de personalización
- [ ] Animaciones de entrada/salida
- [ ] Estadísticas de uso

## 📞 Contacto

Este chatbot está diseñado para responder preguntas sobre mi experiencia profesional. ¡Pruébalo haciendo clic en las cards de preguntas rápidas o escribiendo tu consulta!

---

**Desarrollado con ❤️ usando React, Next.js, TypeScript e IA**

*Última actualización: Octubre 2025*
