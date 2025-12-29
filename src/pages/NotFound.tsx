import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="text-xl text-slate-400">Página não encontrada</p>
        <Link to="/me">
          <Button className="mt-4">
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}

