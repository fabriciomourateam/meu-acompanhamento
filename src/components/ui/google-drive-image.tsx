import { useState } from 'react';

interface GoogleDriveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

/**
 * Componente para exibir imagens do Google Drive
 * Usa iframe como fallback quando a imagem direta falha por CORS
 */
export function GoogleDriveImage({ src, alt, className, onClick, onError }: GoogleDriveImageProps) {
  // Sempre usar iframe para Google Drive (mais confiável)
  const [useIframe, setUseIframe] = useState(true);
  const [imageError, setImageError] = useState(false);

  console.log('🖼️ GoogleDriveImage renderizado:', { src, alt, className });

  // Extrair ID do Google Drive
  const getFileId = (url: string): string | null => {
    const patterns = [
      /open\?id=([^&]+)/,
      /\/file\/d\/([^/]+)/,
      /uc\?.*id=([^&]+)/,
      /\/d\/([^/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fileId = getFileId(src);
  
  console.log('🔍 File ID extraído:', fileId);
  console.log('🔗 Preview URL:', fileId ? `https://drive.google.com/file/d/${fileId}/preview` : 'N/A');

  const handleImageError = () => {
    console.log('🔄 Imagem falhou, tentando iframe...', { src, fileId });
    setImageError(true);
    setUseIframe(true);
    if (onError) onError();
  };

  // Se não conseguiu extrair ID ou não é Google Drive, usar img normal
  if (!fileId || !src.includes('drive.google.com')) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onClick={onClick}
        onError={onError}
      />
    );
  }

  // Tentar carregar como imagem primeiro
  if (!useIframe) {
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    console.log('📸 Tentando carregar imagem:', { fileId, imageUrl });
    return (
      <img 
        src={imageUrl}
        alt={alt} 
        className={className}
        onClick={onClick}
        onError={handleImageError}
        loading="lazy"
      />
    );
  }

  // Fallback: usar iframe (funciona sempre, mas menos performático)
  console.log('✅ Renderizando iframe do Google Drive');
  
  return (
    <div 
      className={`${className} google-drive-image-container`}
      style={{
        position: 'relative',
        display: 'block',
      }}
    >
      <style>{`
        /* Ocultar controles de zoom do Google Drive no iframe */
        .google-drive-image-container iframe {
          pointer-events: auto;
        }
        /* Tentar ocultar os controles nativos do Google Drive */
        .google-drive-image-container iframe::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: transparent;
          pointer-events: none;
        }
      `}</style>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        className="w-full h-full"
        style={{
          border: 'none',
          display: 'block',
        }}
        allow="autoplay"
        title={alt}
        loading="lazy"
      />
      {/* Overlay clicável para capturar cliques - APENAS se tiver onClick */}
      {onClick && (
        <div
          onClick={onClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            zIndex: 1,
          }}
          title="Clique para ampliar"
        />
      )}
    </div>
  );
}
