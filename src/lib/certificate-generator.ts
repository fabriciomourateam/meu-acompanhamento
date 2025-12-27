// Gerador de Certificado de Conquista
import html2canvas from 'html2canvas';

export interface CertificateData {
  patientName: string;
  achievement: string; // ex: "Perdeu 10kg"
  startDate: string;
  endDate: string;
  weightLost?: number;
  bodyFatLost?: number;
  totalWeeks: number;
  coachName?: string;
  coachTitle?: string;
  initialWeight?: number;
  currentWeight?: number;
}

export async function generateCertificate(data: CertificateData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        
        .certificate {
          width: 1200px;
          height: 700px;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%);
          border: 2px solid rgba(234, 179, 8, 0.3);
          border-radius: 20px;
          padding: 60px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 1px solid rgba(234, 179, 8, 0.2);
          border-radius: 16px;
          pointer-events: none;
        }
        
        .trophy {
          font-size: 100px;
          margin-bottom: 20px;
          text-align: center;
          filter: drop-shadow(0 4px 12px rgba(234, 179, 8, 0.3));
        }
        
        .congrats {
          font-size: 16px;
          font-weight: 600;
          color: #eab308;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .recipient-name {
          font-size: 48px;
          font-weight: 800;
          color: #ffffff;
          margin: 10px 0 20px 0;
          text-align: center;
          letter-spacing: 1px;
        }
        
        .achievement {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 35px 0;
          text-align: center;
          line-height: 1.6;
          max-width: 800px;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 50px;
          margin: 30px 0;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat-value {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .stat-value.yellow {
          color: #eab308;
        }
        
        .stat-value.orange {
          color: #ea580c;
        }
        
        .stat-value.purple {
          color: #a855f7;
        }
        
        .stat-label {
          font-size: 12px;
          color: rgba(148, 163, 184, 1);
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          width: 100%;
        }
        
        .period {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
        }
        
        .period strong {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }
        
        .signature {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .signature strong {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="trophy">🏆</div>
        
        <p class="congrats">Parabéns pela Conquista!</p>
        
        <h2 class="recipient-name">${data.patientName}</h2>
        
        <p class="achievement">
          Obteve uma grande transformação,<br>
          alcançando a incrível conquista:<br>
          <strong>${data.achievement}</strong>
        </p>
        
        <div class="stats">
          ${data.weightLost ? `
          <div class="stat">
            <div class="stat-value yellow">${data.weightLost.toFixed(1)}kg</div>
            <div class="stat-label">Perdidos</div>
          </div>
          ` : ''}
          
          ${data.bodyFatLost ? `
          <div class="stat">
            <div class="stat-value orange">${data.bodyFatLost.toFixed(1)}%</div>
            <div class="stat-label">Gordura</div>
          </div>
          ` : ''}
          
          <div class="stat">
            <div class="stat-value purple">${data.totalWeeks}</div>
            <div class="stat-label">Semanas</div>
          </div>
        </div>
        
        <div class="footer">
          <p class="period"><strong>Período:</strong> ${data.startDate} - ${data.endDate}</p>
          <p class="signature"><strong>Assinado por:</strong> ${data.coachName || 'Fabricio Moura Team'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Criar elemento temporário
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    // Aguardar fontes carregarem
    await document.fonts.ready;

    // Gerar imagem com alta qualidade
    const canvas = await html2canvas(tempDiv.querySelector('.certificate') as HTMLElement, {
      scale: 2.5, // Alta resolução
      useCORS: true,
      logging: false,
      backgroundColor: 'transparent',
      width: 1200,
      height: 700
    });

    // Remover elemento temporário
    document.body.removeChild(tempDiv);

    // Converter para PNG e baixar
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificado-${data.patientName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png', 1.0);

    return true;
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
}

// Função auxiliar para verificar se o usuário merece um certificado
export function checkCertificateEligibility(
  weightLost: number,
  totalWeeks: number,
  bodyFatLost?: number
): { eligible: boolean; achievement?: string } {
  // Perdeu 10kg ou mais
  if (weightLost >= 10) {
    return {
      eligible: true,
      achievement: `Perdeu ${weightLost.toFixed(1)}kg em ${totalWeeks} semanas`
    };
  }

  // Perdeu 5% ou mais de gordura
  if (bodyFatLost && bodyFatLost >= 5) {
    return {
      eligible: true,
      achievement: `Reduziu ${bodyFatLost.toFixed(1)}% de gordura corporal`
    };
  }

  // Completou 12 semanas com progresso
  if (totalWeeks >= 12 && weightLost >= 5) {
    return {
      eligible: true,
      achievement: `Completou ${totalWeeks} semanas de transformação`
    };
  }

  return { eligible: false };
}

