/**
 * Calcula o IMC (Índice de Massa Corporal)
 */
export function calcularIMC(peso: number, altura: number): number {
  if (altura <= 0) return 0;
  return peso / (altura * altura);
}

/**
 * Classifica o IMC de acordo com a OMS
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
 * Calcula a massa gorda (gordura corporal)
 */
export function calcularMassaGorda(peso: number, percentualGordura: number): number {
  return (peso * percentualGordura) / 100;
}

/**
 * Calcula a massa magra
 */
export function calcularMassaMagra(peso: number, massaGorda: number): number {
  return peso - massaGorda;
}

/**
 * Calcula a TMB (Taxa Metabólica Basal) usando a fórmula de Mifflin-St Jeor
 */
export function calcularTMB(
  peso: number,
  altura: number,
  idade: number,
  sexo: 'M' | 'F'
): number {
  const baseTMB = 10 * peso + 6.25 * (altura * 100) - 5 * idade;
  return sexo === 'M' ? baseTMB + 5 : baseTMB - 161;
}

