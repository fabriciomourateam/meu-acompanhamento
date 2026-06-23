// Frase motivacional do dia, escolhida deterministicamente pelo dia do ano
// (a mesma frase o dia inteiro, muda à meia-noite). Extraído do PatientPortal
// para enxugar o componente. Comportamento idêntico ao original.
const PHRASES = [
  'Cada refeição é um passo em direção aos seus objetivos! 💪',
  'Você está no caminho certo! Continue assim! 🌟',
  'Pequenas escolhas diárias geram grandes resultados! ✨',
  'Seu compromisso com a saúde é inspirador! 🎯',
  'Cada dia é uma nova oportunidade de cuidar de si! 🌈',
  'Você está construindo um futuro mais saudável! 🚀',
  'Consistência é a chave do sucesso! 🔑',
  'Seu esforço de hoje será sua vitória de amanhã! 🏆',
  'Acredite no processo e confie na jornada! 💚',
  'Você é mais forte do que imagina! 💪',
  'Cada refeição equilibrada é uma vitória! 🎉',
  'Seu bem-estar é sua prioridade! ❤️',
  'Transformação começa com uma refeição de cada vez! 🌱',
  'Você está fazendo a diferença na sua vida! ⭐',
  'Mantenha o foco e siga em frente! 🎯',
  'Sua dedicação é admirável! 👏',
  'Cada escolha saudável te aproxima dos seus sonhos! 🌟',
  'Você está no controle da sua jornada! 🧭',
  'Pequenos progressos diários levam a grandes mudanças! 📈',
  'Sua saúde é seu maior investimento! 💎',
  'Continue firme, você está indo muito bem! 🚀',
  'Cada refeição é uma oportunidade de nutrir seu corpo! 🥗',
  'Você está criando hábitos que transformam vidas! 🌿',
  'Seu comprometimento é inspirador! 💫',
  'A jornada de mil milhas começa com um passo! 🚶',
  'Você está escrevendo sua história de sucesso! 📖',
  'Cada dia é uma chance de ser melhor! 🌅',
  'Seu futuro agradece pelas escolhas de hoje! 🙏',
  'Você está no caminho da transformação! 🦋',
  'Mantenha a motivação e siga seus objetivos! 🎯',
];

export function getDailyMotivationalPhrase(): string {
  // Usar o dia do ano (1-365) para selecionar uma frase.
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return PHRASES[dayOfYear % PHRASES.length];
}
