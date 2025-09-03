import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getCVRAGContext } from '@/lib/cv-embeddings';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
    useRAG = true,
  }: { 
    messages: UIMessage[]; 
    model: string; 
    webSearch: boolean;
    useRAG?: boolean;
  } = await req.json();

  // Obtener el último mensaje del usuario para búsqueda RAG
  const lastMessage = messages[messages.length - 1];
  let ragContext = '';

  // Debug: log all messages structure
  console.log('📋 Total messages:', messages.length);
  console.log('📋 Last message:', JSON.stringify(lastMessage, null, 2));

  // Si RAG está habilitado y no es búsqueda web, obtener contexto del CV
  if (useRAG && !webSearch && lastMessage?.role === 'user') {
    const messageContent = lastMessage.parts
        ? lastMessage.parts.map((part: any) => part.text).join(' ')
        : '';
    console.log('🔍 RAG activado, procesando mensaje:', messageContent);

    //console.log('🔍 RAG activado, procesando mensaje:', lastMessage.content);
    try {
      // Extract text content from UIMessage - handle multiple formats
      let messageContent = '';
      
      // Check for parts array format (AI SDK v5)
      if ((lastMessage as any).parts && Array.isArray((lastMessage as any).parts)) {
        messageContent = (lastMessage as any).parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
      }
      // Try different ways to extract content
      // else if (typeof lastMessage.content === 'string') {
      //   messageContent = lastMessage.content;
      // } else if (Array.isArray(lastMessage.content)) {
      //   messageContent = lastMessage.content
      //     .map(part => {
      //       if (typeof part === 'string') return part;
      //       if (typeof part === 'object' && part !== null) {
      //         return (part as any).text || (part as any).content || '';
      //       }
      //       return '';
      //     })
      //     .filter(Boolean)
      //     .join(' ');

      // } else if (lastMessage.content && typeof lastMessage.content === 'object') {
      //   // Handle object format
      //   messageContent = (lastMessage.content as any).text || (lastMessage.content as any).content || '';
      // }

      // else if (typeof ((lastMessage as any).content)) {
      //   messageContent = (lastMessage as any).content;
      // } else if (Array.isArray((lastMessage as any).content)) {
      //   messageContent = (lastMessage as any).content
      //     .map(part => {
      //       if (typeof part === 'string') return part;
      //       if (typeof part === 'object' && part !== null) {
      //         return (part as any).text || (part as any).content || '';
      //       }
      //       return '';
      //     })
      //     .filter(Boolean)
      //     .join(' ');

      else if (Array.isArray((lastMessage as any).content)) {
        messageContent = (lastMessage as any).content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (typeof part === 'object' && part !== null) {
              return (part as any).text || (part as any).content || '';
            }
            return '';
          })
          .filter(Boolean)
          .join(' ');

      } else if ((lastMessage as any).content && typeof (lastMessage as any).content === 'object') {
        // Handle object format
        messageContent = (lastMessage as any).content.text || (lastMessage as any).content.content || '';
      }
      
      // Fallback: try to get text from other message properties
      if (!messageContent && (lastMessage as any).text) {
        messageContent = (lastMessage as any).text;
      }
      
      // // Last resort: stringify and extract if it's a complex object
      // if (!messageContent && lastMessage.content) {
      //   try {
      //     const contentStr = JSON.stringify(lastMessage.content);
      //     if (contentStr && contentStr !== '{}' && contentStr !== 'null') {
      //       messageContent = contentStr;
      //     }
      //   } catch (e) {
      //     // Ignore JSON errors
      //   }
      // }
      if (!messageContent && (lastMessage as any).text) {
        messageContent = (lastMessage as any).text;
      }

      // Last resort: convertir a string si es un objeto complejo
      if (!messageContent && (lastMessage as any).content) {
        try {
          const contentStr = JSON.stringify((lastMessage as any).content);
          if (contentStr && contentStr !== '{}' && contentStr !== 'null') {
            messageContent = contentStr;
          }
        } catch (e) {
          // Ignorar errores de JSON
        }
      }
      
      console.log('📝 Contenido extraído:', messageContent);
      
      if (messageContent && messageContent.trim()) {
        console.log('🚀 Llamando a getCVRAGContext...');
        ragContext = await getCVRAGContext(messageContent.trim());
        console.log('✅ Contexto RAG obtenido:', ragContext ? `${ragContext.length} caracteres` : 'vacío');
      } else {
        console.log('⚠️ No se pudo extraer contenido del mensaje');
      }
    } catch (error) {
      console.error('❌ Error getting CV RAG context:', error);
    }
  } else {
    console.log('⚠️ RAG no activado. useRAG:', useRAG, 'webSearch:', webSearch, 'lastMessage role:', lastMessage?.role);
  }

  // Construir prompt del sistema con contexto del CV
  let systemPrompt = 'Eres un asistente útil que puede responder preguntas y ayudar con tareas';
  
  if (ragContext) {
    systemPrompt = `**Tu Rol y Objetivo:**
Eres un asistente de IA de élite que representa a Omar Leonardo Caiguan Ojeda, un Programador Web Profesional con amplia experiencia. Tu objetivo principal es responder preguntas sobre su perfil, proyectos y habilidades de manera precisa, profesional y convincente, basándote *única y exclusivamente* en el contexto proporcionado.

**Tu Persona:**
Actúa como si fueras Omar. Utiliza la primera persona ("Yo", "mi", "desarrollé"). Proyecta confianza, competencia técnica y pasión por el desarrollo de software. Tu tono debe ser profesional pero accesible.

**Contexto Técnico (Tu Base de Conocimiento):**
A continuación se encuentra la información extraída directamente del CV y portafolio de Omar. Esta es tu única fuente de verdad.
---
${ragContext}
---

**Reglas Críticas de Respuesta:**

1.  **Exclusividad del Contexto:** NUNCA utilices conocimiento externo a la información proporcionada arriba. Si la respuesta no está en el contexto, es crucial que no inventes nada.
2.  **Formato Profesional:** Estructura tus respuestas para máxima claridad. Utiliza markdown (listas, negritas) para resaltar tecnologías, proyectos o habilidades clave. Por ejemplo: "Para el backend, utilicé **Node.js** y **Express**, con una base de datos **PostgreSQL**."
3.  **Respuesta Directa y Concisa:** Ve al grano. Responde la pregunta del usuario de forma directa y evita información superflua.
4.  **Manejo de Información Faltante:** Si la respuesta no se encuentra en el contexto, responde con una de las siguientes frases de manera profesional:
    *   "No tengo detalles específicos sobre ese punto en la información de mi perfil, pero puedo contarte sobre..." (y ofreces un tema relacionado que sí esté en el contexto).
    *   "Esa información no está incluida en mi CV. ¿Te gustaría que profundice en alguno de mis proyectos o habilidades?"
5.  **Síntesis, no copia:** No copies y pegues el contexto. Sintetiza la información relevante para construir una respuesta natural y coherente.

Ahora, basándote en todas estas reglas, responde la pregunta del usuario.`
  }

  // Debug logging
  console.log('🔍 SystemPrompt completo:')
  console.log('='.repeat(50))
  console.log(systemPrompt)
  console.log('='.repeat(50))
  console.log(`📏 Longitud del systemPrompt: ${systemPrompt.length} caracteres`)

  const result = streamText({
    model: webSearch ? 'perplexity/sonar' : model,
    messages: convertToModelMessages(messages),
    system: systemPrompt,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}