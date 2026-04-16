import Link from 'next/link';

export const metadata = {
  title: 'Simulados Bernardo - Início',
  description: 'Escolha um simulado para começar',
};

export default function Home() {
  const simulados = [
    {
      id: 1,
      title: '📚 Português',
      description: 'Teste seus conhecimentos em Portuguese com 10 questões sobre fonética, gramática e ortografia',
      emoji: '🔤',
      color: 'from-blue-400 to-blue-600',
      href: '/simulado-portugues',
      difficulty: '⭐⭐⭐ 3º Ano',
      questoes: 10,
      pontos: 10,
    },
    {
      id: 2,
      title: '🔢 Matemática',
      description: 'Resolva problemas de aritmética, geometria e lógica em 10 questões personalizadas',
      emoji: '🧮',
      color: 'from-green-400 to-green-600',
      href: '/simulado-matematica',
      difficulty: '⭐⭐⭐ 3º Ano',
      questoes: 10,
      pontos: 10,
    },
    {
      id: 3,
      title: '🌍 Ciências',
      description: 'Explore tópicos sobre seres vivos, corpo humano e o meio ambiente',
      emoji: '🔬',
      color: 'from-purple-400 to-purple-600',
      href: '/simulado-ciencias',
      difficulty: '⭐⭐⭐ 3º Ano',
      questoes: 30,
      pontos: 30,
    },
    {
      id: 4,
      title: '📖 História',
      description: 'Explore a história das cidades, culturas, tradições e as pessoas que as formam',
      emoji: '📖',
      color: 'from-orange-400 to-orange-600',
      href: '/simulado-historia',
      difficulty: '⭐⭐⭐ 3º Ano',
      questoes: 30,
      pontos: 30,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-3">📚 Simulados Bernardo</h1>
          <p className="text-xl text-slate-600 mb-2">Plataforma Interativa de Aprendizado</p>
          <p className="text-lg text-slate-500">Para alunos do Ensino Fundamental</p>
        </div>

        {/* Introdução */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-slate-700 leading-relaxed">
              🎓 Bem-vindo! Aqui você vai encontrar simulados interativos com <strong>gamificação</strong>, 
              <strong> feedback visual</strong> e <strong>dicas pedagógicas</strong> em cada questão. 
            </p>
            <p className="text-slate-600 mt-4">
              ✨ Escolha um simulado abaixo e comece a estudar agora!
            </p>
          </div>
        </div>

        {/* Grid de Simulados */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {simulados.map((simulado) => (
            <Link key={simulado.id} href={simulado.comingSoon ? '#' : simulado.href}>
              <div
                className={`bg-white rounded-3xl shadow-lg p-8 transition-all transform hover:scale-105 cursor-pointer group ${
                  simulado.comingSoon ? 'opacity-70' : 'hover:shadow-2xl'
                }`}
              >
                {/* Badge "Em Breve" */}
                {simulado.comingSoon && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                    Em Breve
                  </div>
                )}

                {/* Emoji Grande */}
                <div className="text-6xl mb-4">{simulado.emoji}</div>

                {/* Título */}
                <h2 className="text-3xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {simulado.title}
                </h2>

                {/* Dificuldade */}
                <p className="text-sm text-slate-500 mb-3">{simulado.difficulty}</p>

                {/* Descrição */}
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {simulado.description}
                </p>

                {/* Botão */}
                <div
                  className={`inline-block px-6 py-3 rounded-2xl font-bold text-white transition-all ${
                    simulado.comingSoon
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${simulado.color} group-hover:shadow-lg`
                  }`}
                >
                  {simulado.comingSoon ? '🚀 Em Breve' : '▶️ Começar'}
                </div>

                {/* Stats */}
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">📝 {simulado.questoes} questões</span>
                    <span className="text-slate-600">⏱️ ~{Math.ceil(simulado.questoes / 10) * 15} min</span>
                    <span className="text-slate-600">🎯 {simulado.pontos} pontos</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Seção de Benefícios */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Por que usar Simulados Bernardo?</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-semibold mb-2">Feedback Visual</p>
              <p className="text-sm text-blue-100">Saiba na hora se acertou ou errou</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">💡</div>
              <p className="font-semibold mb-2">Dicas Pedagógicas</p>
              <p className="text-sm text-blue-100">Aprenda a regra em cada questão</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="font-semibold mb-2">Gamificação</p>
              <p className="text-sm text-blue-100">Veja sua pontuação e mensagens motivacionais</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">📊</div>
              <p className="font-semibold mb-2">Análise Detalhada</p>
              <p className="text-sm text-blue-100">Revise cada resposta com explicações</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-600">
          <p>© 2026 Simulados Bernardo - Plataforma Educativa</p>
        </div>
      </div>
    </div>
  );
}
