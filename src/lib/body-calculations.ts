/**
 * Utilitários para cálculos de composição corporal
 * Inclui: IMC, Massa Gorda, Massa Magra, TMB
 */

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * Fórmula: peso / (altura * altura)
 * @param peso Peso em kg
 * @param altura Altura em metros (ex: 1.75)
 * @returns IMC calculado
 */
export function calcularIMC(peso: number, altura: number): number {
  if (altura <= 0) throw new Error('Altura deve ser maior que zero');
  return parseFloat((peso / (altura * altura)).toFixed(2));
}

/**
 * Calcula a Massa Gorda em kg
 * Fórmula: (peso * percentual_gordura) / 100
 * @param peso Peso em kg
 * @param percentualGordura Percentual de gordura (ex: 18.5)
 * @returns Massa gorda em kg
 */
export function calcularMassaGorda(peso: number, percentualGordura: number): number {
  return parseFloat(((peso * percentualGordura) / 100).toFixed(2));
}

/**
 * Calcula a Massa Magra em kg
 * Fórmula: peso - massa_gorda
 * @param peso Peso em kg
 * @param massaGorda Massa gorda em kg
 * @returns Massa magra em kg
 */
export function calcularMassaMagra(peso: number, massaGorda: number): number {
  return parseFloat((peso - massaGorda).toFixed(2));
}

/**
 * Calcula a TMB (Taxa Metabólica Basal) usando a fórmula de Mifflin-St Jeor
 * Esta é a fórmula mais precisa atualmente aceita
 * 
 * Homens: TMB = (10 × peso) + (6.25 × altura_cm) − (5 × idade) + 5
 * Mulheres: TMB = (10 × peso) + (6.25 × altura_cm) − (5 × idade) − 161
 * 
 * @param peso Peso em kg
 * @param altura Altura em metros (ex: 1.75)
 * @param idade Idade em anos
 * @param sexo 'M', 'F', 'Masculino' ou 'Feminino'
 * @returns TMB em kcal/dia
 */
export function calcularTMB(
  peso: number,
  altura: number,
  idade: number,
  sexo: 'M' | 'F' | 'Masculino' | 'Feminino'
): number {
  const alturaCm = altura * 100;
  const sexoNormalizado = sexo === 'M' || sexo === 'Masculino' ? 'M' : 'F';
  
  // Fórmula base
  const tmb = (10 * peso) + (6.25 * alturaCm) - (5 * idade);
  
  // Ajuste por sexo
  if (sexoNormalizado === 'M') {
    return Math.round(tmb + 5);
  } else {
    return Math.round(tmb - 161);
  }
}

/**
 * Obtém a classificação do IMC segundo a OMS
 * @param imc Valor do IMC
 * @returns Classificação textual
 */
export function classificarIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/**
 * Obtém a cor do badge baseado no IMC para UI
 * @param imc Valor do IMC
 * @returns Classes CSS do Tailwind
 */
export function corIMC(imc: number): string {
  if (imc < 18.5) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (imc < 25) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (imc < 30) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  if (imc < 35) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}

/**
 * Calcula o percentual de mudança entre dois valores
 * @param valorInicial Valor inicial
 * @param valorFinal Valor final
 * @returns Percentual de mudança (positivo = aumento, negativo = redução)
 */
export function calcularPercentualMudanca(valorInicial: number, valorFinal: number): number {
  if (valorInicial === 0) return 0;
  return parseFloat((((valorFinal - valorInicial) / valorInicial) * 100).toFixed(1));
}

/**
 * Formata número com casas decimais
 * @param valor Número a formatar
 * @param casas Número de casas decimais (padrão: 1)
 * @returns Número formatado como string
 */
export function formatarNumero(valor: number, casas: number = 1): string {
  return valor.toFixed(casas);
}

