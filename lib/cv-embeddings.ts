import OpenAI from 'openai'
import { supabaseAdmin } from './supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Define interface for CV data record
interface CVDataRecord {
  id?: string;
  section: string;
  title: string;
  content: string;
  embedding: number[] | null;
  created_at?: string;
  updated_at?: string;
}

// Define interface for search result
interface SearchResult extends CVDataRecord {
  similarity: number;
}

// Función para generar embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  })
  
  return response.data[0].embedding
}

// Función para búsqueda semántica en cv_data
export async function searchCVData(
  query: string,
  matchThreshold: number = 0.3,
  matchCount: number = 5
) {
  try {
    console.log('🔍 Iniciando búsqueda RAG para:', query);
    
    // 1. Generar embedding de la consulta
    const queryEmbedding = await generateEmbedding(query)
    console.log('📊 Embedding generado, dimensiones:', queryEmbedding.length);

    // 2. Buscar en cv_data usando similaridad coseno
    console.log('🔍 Intentando función SQL search_cv_data...');
    const { data, error } = await supabaseAdmin.rpc('search_cv_data', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    })

    if (error) {
      // Si la función no existe, usar consulta manual
      console.log('❌ Función search_cv_data no encontrada:', error.message);
      console.log('🔄 Usando consulta manual...');
      return await manualSearchCVData(queryEmbedding, matchThreshold, matchCount)
    }

    console.log('✅ Función SQL ejecutada, resultados:', data?.length || 0);
    return {
      success: true,
      results: data || []
    }
  } catch (error) {
    console.error('💥 Error searching CV data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: []
    }
  }
}

// Búsqueda manual si no existe la función SQL
async function manualSearchCVData(
  queryEmbedding: number[],
  matchThreshold: number,
  matchCount: number
) {
  console.log('🔍 Ejecutando búsqueda manual...');
  
  const { data, error } = await supabaseAdmin
    .from('cv_data')
    .select('*')
    .not('embedding', 'is', null)

  if (error) {
    console.error('❌ Error en consulta manual:', error);
    throw error;
  }

  console.log('📊 Registros encontrados en cv_data:', data?.length || 0);
  
  if (!data || data.length === 0) {
    console.log('⚠️ No hay registros en cv_data');
    return {
      success: true,
      results: []
    };
  }

  // Calcular similaridad manualmente
  const results = data
    ?.map((record: CVDataRecord): SearchResult | null => {
      if (!record.embedding) {
        console.log('⚠️ Registro sin embedding:', record.title);
        return null;
      }
      
      try {
        const similarity = cosineSimilarity(queryEmbedding, record.embedding)
        
        console.log(`📊 ${record.title}: similaridad = ${similarity.toFixed(3)}`);
        
        return {
          ...record,
          similarity
        }
      } catch (e) {
        console.error('❌ Error calculando similaridad para:', record.title, e);
        return null;
      }
    })
    .filter((result): result is SearchResult => result !== null && result.similarity >= matchThreshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount) || []

  console.log('✅ Resultados filtrados:', results.length);
  console.log('🎯 Mejores matches:', results.map(r => `${r.title} (${r.similarity.toFixed(3)})`));

  return {
    success: true,
    results
  }
}

// Función para calcular similaridad coseno
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Función para obtener contexto RAG del CV
export async function getCVRAGContext(query: string): Promise<string> {
  let searchResult;

  // Lógica de búsqueda híbrida
  if (query.toLowerCase().includes('proyecto') || query.toLowerCase().includes('project')) {
    console.log('🎯 Búsqueda específica de proyectos detectada');
    searchResult = await searchCVDataBySection('Proyecto', 10);
  } else {
    console.log('🧠 Realizando búsqueda semántica estándar');
    searchResult = await searchCVData(query, 0.3, 10);
  }

  if (!searchResult.success || searchResult.results.length === 0) {
    return '';
  }

  const formattedResults = searchResult.results.map((result: SearchResult, index: number) => {
    return `Fuente de Información ${index + 1}:\n- Sección: ${result.section}\n- Título: ${result.title}\n- Contenido: ${result.content}`;
  });

  const context = formattedResults.join('\n\n---\n\n');

  return context;
}

// Nueva función para buscar datos del CV por sección
export async function searchCVDataBySection(section: string, limit: number = 10): Promise<{
  success: boolean;
  results: Array<{ section: string; title: string; content: string; similarity?: number; }>;
  error?: string;
}> {
  try {
    console.log(`🔍 Buscando directamente en la sección: ${section}`);
    const { data, error } = await supabaseAdmin
      .from('cv_data')
      .select('section, title, content')
      .eq('section', section)
      .limit(limit);

    if (error) {
      console.error('❌ Error en búsqueda por sección:', error);
      return { success: false, results: [], error: error.message };
    }

    console.log(`✅ Encontrados ${data?.length || 0} resultados en la sección ${section}`);
    return { success: true, results: data || [] };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error fatal en searchCVDataBySection:', errorMessage);
    return { success: false, results: [], error: errorMessage };
  }
}

// Función para agregar nuevo elemento al CV
export async function addCVData(
  section: string,
  title: string,
  content: string
) {
  try {
    // Generar embedding
    const textForEmbedding = `${title}\n${content}`
    const embedding = await generateEmbedding(textForEmbedding)

    // Insertar en la base de datos
    const { data, error } = await supabaseAdmin
      .from('cv_data')
      .insert({
        section,
        title,
        content,
        embedding
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error adding CV data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Función para obtener todos los datos del CV
export async function getAllCVData() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cv_data')
      .select('*')
      .order('section', { ascending: true })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}
