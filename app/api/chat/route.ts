import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getCVRAGContext } from '@/lib/cv-embeddings';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Type guard to check for text/content properties in message parts
function isPartWithText(part: unknown): part is { text: string } | { content: string } {
  return (
    typeof part === 'object' &&
    part !== null &&
    ('text' in part || 'content' in part)
  );
}

function extractTextFromMessage(message: UIMessage): string {
  const content = (message as { content?: unknown }).content;
  const parts = (message as { parts?: unknown }).parts;

  const extractFromParts = (items: unknown[]): string => {
    return items
      .map(part => {
        if (typeof part === 'string') return part;
        if (isPartWithText(part)) {
          return (part as { text?: string }).text || (part as { content?: string }).content || '';
        }
        return '';
      })
      .join(' ');
  };

  if (Array.isArray(parts)) {
    return extractFromParts(parts);
  }

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return extractFromParts(content);
  }

  return '';
}

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
    const messageContent = extractTextFromMessage(lastMessage);
    console.log('🔍 RAG activado, procesando mensaje:', messageContent);

    //console.log('🔍 RAG activado, procesando mensaje:', lastMessage.content);
    try {
      // Extract text content from UIMessage - handle multiple formats
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

  // Define el prompt base que siempre se usará
  let systemPrompt = `**Tu Rol y Objetivo:**
Eres un asistente de IA conversacional que representa a Omar Caiguan, un Programador Web Profesional. Tu nombre es "Asistente de IA de Omar".

**Tu Persona:**
Tu propósito es ayudar a los usuarios a conocer la experiencia profesional, proyectos y habilidades de Omar. Responde de manera profesional, amigable y servicial. Cuando te pregunten quién eres, preséntate como el asistente de IA de Omar. No finjas ser Omar, sino que hablas en su nombre.

**Reglas Críticas de Respuesta:**
1.  **Identidad Clara:** Si te preguntan "¿quién eres?" o "¿a quién representas?", responde claramente: "Soy el asistente de inteligencia artificial de Omar Caiguan, creado para responder preguntas sobre su carrera profesional".
2.  **Fuente de Conocimiento:** Basa tus respuestas únicamente en la información proporcionada en el contexto. Si no tienes la información, indica amablemente que no tienes datos sobre ese tema específico en el perfil de Omar.
3.  **No Inventes:** Nunca inventes información. Si la respuesta no está en el contexto, no la proporciones.`;

  // Si se encontró contexto RAG, se añade al prompt del sistema
  if (ragContext) {
    systemPrompt += `

**Contexto Técnico Adicional (Tu Base de Conocimiento):**
La siguiente información ha sido extraída del CV y portafolio de Omar Caiguan para responder la pregunta del usuario. Úsala como tu principal fuente de verdad.
---
${ragContext}
---`;
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