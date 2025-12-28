import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Smartphone, Monitor, X, CheckCircle2, ExternalLink, ChevronRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Detectar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInStandaloneMode = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    
    // Detectar se é mobile (qualquer dispositivo móvel)
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
                          (window.innerWidth <= 768);
    setIsMobile(isMobileDevice);

    // Escutar evento de instalação (Chrome, Edge, etc)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    // Sempre abrir dialog com instruções
    setShowInstructions(true);
  };

  const handleInstallFromDialog = async () => {
    if (deferredPrompt) {
      // Chrome/Edge - mostrar prompt nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
        setShowInstructions(false); // Fechar dialog após instalação
      }
    }
  };

  if (isInstalled) {
    return null; // Não mostrar se já estiver instalado
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
      >
        <Download className="w-4 h-4 mr-2" />
        Instalar App
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-[#F5F7FB] shadow-2xl [&>button]:text-[#222222] [&>button]:hover:text-[#00C98A] [&>button]:opacity-100">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-[#222222] flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#00C98A]" />
              Como Instalar o App
            </DialogTitle>
            <DialogDescription className="text-[#777777] mt-2">
              Siga as instruções abaixo para instalar o aplicativo no seu dispositivo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Instruções para iOS (Safari) */}
            {(
              <Collapsible 
                open={openSections.has('ios')} 
                onOpenChange={(open) => {
                  const newSet = new Set(openSections);
                  if (open) newSet.add('ios');
                  else newSet.delete('ios');
                  setOpenSections(newSet);
                }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between text-[#222222]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-[#00C98A]" />
                          iPhone/iPad (Safari)
                        </div>
                        <ChevronRight 
                          className={`w-5 h-5 text-[#777777] transition-transform ${openSections.has('ios') ? 'rotate-90' : ''}`} 
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Abra o Safari</p>
                      <p className="text-sm text-[#777777]">Certifique-se de estar usando o Safari (não funciona no Chrome no iOS)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Toque no botão de Compartilhar</p>
                      <p className="text-sm text-[#777777]">Localizado na parte inferior da tela (ícone de quadrado com seta para cima)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Selecione "Adicionar à Tela de Início"</p>
                      <p className="text-sm text-[#777777]">Role para baixo se necessário para encontrar esta opção</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Confirme a instalação</p>
                      <p className="text-sm text-[#777777]">Toque em "Adicionar" no canto superior direito</p>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Instruções para Android (Chrome) */}
            {(
              <Collapsible 
                open={openSections.has('android')} 
                onOpenChange={(open) => {
                  const newSet = new Set(openSections);
                  if (open) newSet.add('android');
                  else newSet.delete('android');
                  setOpenSections(newSet);
                }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between text-[#222222]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-[#00C98A]" />
                          Android (Chrome)
                        </div>
                        <ChevronRight 
                          className={`w-5 h-5 text-[#777777] transition-transform ${openSections.has('android') ? 'rotate-90' : ''}`} 
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Abra o Chrome</p>
                      <p className="text-sm text-[#777777]">Certifique-se de estar usando o Google Chrome</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Procure pelo banner de instalação</p>
                      <p className="text-sm text-[#777777]">Um banner aparecerá na parte inferior da tela oferecendo para instalar o app</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Ou use o menu do Chrome</p>
                      <p className="text-sm text-[#777777]">Toque nos três pontos (⋮) no canto superior direito → "Instalar app" ou "Adicionar à tela inicial"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Confirme a instalação</p>
                      <p className="text-sm text-[#777777]">Toque em "Instalar" na janela de confirmação</p>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Instruções para Desktop (Chrome/Edge) */}
            {(
              <Collapsible 
                open={openSections.has('desktop')} 
                onOpenChange={(open) => {
                  const newSet = new Set(openSections);
                  if (open) newSet.add('desktop');
                  else newSet.delete('desktop');
                  setOpenSections(newSet);
                }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="text-lg flex items-center justify-between text-[#222222]">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-5 h-5 text-[#00C98A]" />
                          Computador (Chrome/Edge)
                        </div>
                        <ChevronRight 
                          className={`w-5 h-5 text-[#777777] transition-transform ${openSections.has('desktop') ? 'rotate-90' : ''}`} 
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Procure pelo ícone de instalação</p>
                      <p className="text-sm text-[#777777]">Na barra de endereço, você verá um ícone de instalação (+ ou download)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Clique no ícone</p>
                      <p className="text-sm text-[#777777]">Uma janela aparecerá perguntando se você deseja instalar o app</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C98A] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-[#222222]">Confirme a instalação</p>
                      <p className="text-sm text-[#777777]">Clique em "Instalar" para adicionar o app ao seu computador</p>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Informações Gerais */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  Benefícios do App Instalado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-white/90 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span>Acesso rápido direto da tela inicial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span>Funciona offline (algumas funcionalidades)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span>Experiência mais rápida e fluida</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span>Notificações push (em breve)</span>
                  </li>
                </ul>
                
                {/* Botão para instalar o app */}
                {deferredPrompt && (
                  <Button
                    onClick={handleInstallFromDialog}
                    className="w-full bg-white hover:bg-white/90 text-emerald-600 font-semibold shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar App Agora
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InstallPWAButton;

