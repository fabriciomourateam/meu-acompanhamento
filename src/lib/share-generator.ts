// Sistema de Compartilhamento Inteligente
import html2canvas from 'html2canvas';

export interface ShareData {
  patientName: string;
  initialWeight: number;
  currentWeight: number;
  weightLost: number;
  initialBodyFat?: number;
  currentBodyFat?: number;
  bodyFatLost?: number;
  totalCheckins: number;
  daysSinceStart: number;
  avgScore: number;
}

export async function generateShareImage(data: ShareData): Promise<string> {
  // Criar elemento temporário com o design
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '1080px';
  container.style.height = '1080px';
  
  container.innerHTML = `
    <div style="
      width: 1080px;
      height: 1080px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 50px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <!-- Header -->
      <div>
        <div style="
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        ">
          🏆 Minha Evolução
        </div>
        <div style="
          font-size: 32px;
          font-weight: 600;
          opacity: 0.95;
        ">
          ${data.patientName}
        </div>
      </div>

      <!-- Estatísticas Principais -->
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        margin: 40px 0;
      ">
        <!-- Peso -->
        <div style="
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 2px solid rgba(255,255,255,0.2);
        ">
          <div style="font-size: 24px; opacity: 0.9; margin-bottom: 10px;">
            ⚖️ Peso
          </div>
          <div style="font-size: 56px; font-weight: 800; margin-bottom: 5px;">
            ${data.weightLost.toFixed(1)}kg
          </div>
          <div style="font-size: 20px; opacity: 0.85;">
            ${data.initialWeight.toFixed(1)}kg → ${data.currentWeight.toFixed(1)}kg
          </div>
        </div>

        <!-- % Gordura -->
        ${data.bodyFatLost ? `
        <div style="
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 2px solid rgba(255,255,255,0.2);
        ">
          <div style="font-size: 24px; opacity: 0.9; margin-bottom: 10px;">
            💪 % Gordura
          </div>
          <div style="font-size: 56px; font-weight: 800; margin-bottom: 5px;">
            ${data.bodyFatLost.toFixed(1)}%
          </div>
          <div style="font-size: 20px; opacity: 0.85;">
            ${data.initialBodyFat?.toFixed(1)}% → ${data.currentBodyFat?.toFixed(1)}%
          </div>
        </div>
        ` : `
        <div style="
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          border: 2px solid rgba(255,255,255,0.2);
        ">
          <div style="font-size: 24px; opacity: 0.9; margin-bottom: 10px;">
            📊 Performance
          </div>
          <div style="font-size: 56px; font-weight: 800; margin-bottom: 5px;">
            ${data.avgScore.toFixed(1).replace('.', ',')}/100
          </div>
          <div style="font-size: 20px; opacity: 0.85;">
            Pontuação média
          </div>
        </div>
        `}
      </div>

      <!-- Estatísticas Secundárias -->
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      ">
        <div style="
          background: rgba(255,255,255,0.1);
          border-radius: 15px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 40px; font-weight: 700;">
            ${data.totalCheckins}
          </div>
          <div style="font-size: 18px; opacity: 0.85;">
            Check-ins realizados
          </div>
        </div>
        <div style="
          background: rgba(255,255,255,0.1);
          border-radius: 15px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 40px; font-weight: 700;">
            ${data.daysSinceStart}
          </div>
          <div style="font-size: 18px; opacity: 0.85;">
            Dias de jornada
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        text-align: center;
        font-size: 20px;
        opacity: 0.9;
        font-weight: 500;
      ">
        💪 Transformação é consistência + dedicação ✨
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Gerar imagem
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false
    });

    const imageData = canvas.toDataURL('image/png', 1.0);
    
    // Remover elemento temporário
    document.body.removeChild(container);

    return imageData;
  } catch (error) {
    console.error('Erro ao gerar imagem de compartilhamento:', error);
    document.body.removeChild(container);
    throw error;
  }
}

export function generateWhatsAppMessage(data: ShareData): string {
  const message = `🏆 *Minha Evolução*\n\n` +
    `📉 Peso perdido: *${data.weightLost.toFixed(1)}kg*\n` +
    `⚖️ ${data.initialWeight.toFixed(1)}kg → ${data.currentWeight.toFixed(1)}kg\n\n` +
    (data.bodyFatLost ? 
      `💪 % Gordura reduzida: *${data.bodyFatLost.toFixed(1)}%*\n` +
      `${data.initialBodyFat?.toFixed(1)}% → ${data.currentBodyFat?.toFixed(1)}%\n\n` 
      : '') +
    `📊 ${data.totalCheckins} check-ins em ${data.daysSinceStart} dias\n` +
    `⭐ Performance média: ${data.avgScore.toFixed(1).replace('.', ',')}/100\n\n` +
    `💪 Transformação é consistência + dedicação! ✨`;

  return encodeURIComponent(message);
}

export function shareViaWhatsApp(message: string) {
  const url = `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
}

export async function downloadImage(imageData: string, filename: string = 'minha-evolucao.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageData;
  link.click();
}

