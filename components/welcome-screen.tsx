'use client';

import { useEffect, useRef } from 'react';
import { Code2, Sparkles, Database, Rocket } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  trail: { x: number; y: number; opacity: number }[];
}

interface WelcomeScreenProps {
  onQuickQuestion: (question: string) => void;
}

export const WelcomeScreen = ({ onQuickQuestion }: WelcomeScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Inicializar partículas
    particlesRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.6 + 0.3),
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      trail: [],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.y += particle.speedY;
        particle.x += particle.speedX;

        particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });
        if (particle.trail.length > 8) particle.trail.shift();

        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
          particle.trail = [];
        }

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }

        // Dibujar trail
        particle.trail.forEach((point, index) => {
          const trailOpacity = (point.opacity * index) / particle.trail.length;
          const trailSize = particle.size * (index / particle.trail.length);
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${trailOpacity * 0.3})`;
          ctx.fill();
        });

        // Glow exterior
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, `rgba(59, 130, 246, ${particle.opacity})`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${particle.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Núcleo brillante
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${particle.opacity * 1.2})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const quickQuestions = [
    {
      icon: <Code2 className="w-5 h-5" />,
      title: 'Habilidades Técnicas',
      description: '¿Qué tecnologías dominas?',
      question: '¿Cuáles son tus principales habilidades técnicas como desarrollador web?',
    },
    {
      icon: <Rocket className="w-5 h-5" />,
      title: 'Proyectos Destacados',
      description: 'Cuéntame sobre tus proyectos',
      question: '¿Qué proyectos destacados has desarrollado?',
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'Experiencia RAG',
      description: 'Sobre este chatbot',
      question: '¿Cómo funciona este chatbot RAG que has desarrollado?',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Experiencia Profesional',
      description: 'Tu trayectoria laboral',
      question: '¿Cuál es tu experiencia profesional como desarrollador?',
    },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-6">
      {/* Canvas de partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Contenido */}
      <div className="relative z-10 max-w-3xl w-full">
        {/* Header con descripción profesional */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Chatbot RAG Portfolio</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Hola, soy <span className="text-blue-400">Omar Caiguan</span>
          </h1>
          
          <p className="text-lg text-gray-300 mb-2">
            Desarrollador Web Full Stack
          </p>
          
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Especializado en <strong className="text-blue-400">React, Next.js, TypeScript</strong> y tecnologías modernas. 
            Apasionado por crear experiencias web innovadoras con <strong className="text-blue-400">IA</strong>, 
            <strong className="text-blue-400"> RAG</strong> y arquitecturas escalables.
          </p>
        </div>

        {/* Grid de opciones rápidas */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {quickQuestions.map((item, index) => (
            <button
              key={index}
              onClick={() => onQuickQuestion(item.question)}
              className="group relative flex flex-col items-start gap-2 p-5 rounded-xl transition-all duration-300 text-left overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
              
              <div className="relative z-10 flex items-start gap-3 w-full">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Prompt sugerido */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            O escribe tu pregunta abajo para conocer más sobre mi experiencia y proyectos
          </p>
        </div>
      </div>
    </div>
  );
};
