import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Maximize2, Minimize2 } from "lucide-react";

interface ResponsiveIframeProps {
  src: string;
  title: string;
  className?: string;
}

export function ResponsiveIframe({ src, title, className = "" }: ResponsiveIframeProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop' | 'fullscreen'>('auto');
  
  // Determina a altura baseada no modo de visualização
  const getHeight = () => {
    switch (viewMode) {
      case 'mobile':
        return "calc(100vh - 140px)";
      case 'desktop':
        return "1200px";
      case 'fullscreen':
        return "calc(100vh - 80px)";
      default:
        return isMobile ? "calc(100vh - 140px)" : "1200px";
    }
  };
  
  const getMinHeight = () => {
    switch (viewMode) {
      case 'mobile':
        return "600px";
      case 'desktop':
        return "800px";
      case 'fullscreen':
        return "calc(100vh - 80px)";
      default:
        return isMobile ? "600px" : "800px";
    }
  };
  
  const getMaxHeight = () => {
    switch (viewMode) {
      case 'mobile':
        return "calc(100vh - 140px)";
      case 'desktop':
        return "1200px";
      case 'fullscreen':
        return "calc(100vh - 80px)";
      default:
        return isMobile ? "calc(100vh - 140px)" : "1200px";
    }
  };
  
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 ${className}`}>
      {/* Controles de visualização */}
      <div className="flex justify-end gap-2 p-3 bg-gray-50 border-b">
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
            className="h-8 px-2"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
            className="h-8 px-2"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'fullscreen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('fullscreen')}
            className="h-8 px-2"
          >
            {viewMode === 'fullscreen' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <iframe 
        src={src}
        width="100%"
        height={getHeight()}
        frameBorder="0"
        title={title}
        className="w-full"
        style={{
          minHeight: getMinHeight(),
          maxHeight: getMaxHeight()
        }}
      />
    </div>
  );
}
