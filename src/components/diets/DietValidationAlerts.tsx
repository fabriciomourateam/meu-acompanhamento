import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { dietValidationService, ValidationResult } from '@/lib/diet-validation-service';

interface DietValidationAlertsProps {
  validation: ValidationResult;
  className?: string;
}

export function DietValidationAlerts({ validation, className }: DietValidationAlertsProps) {
  if (validation.valid && validation.warnings.length === 0 && validation.errors.length === 0) {
    return (
      <Alert className={`border-[#00C98A] bg-[#00C98A]/10 ${className}`}>
        <CheckCircle className="h-4 w-4 !text-[#00C98A]" />
        <AlertTitle className="text-[#00C98A] font-semibold">Plano válido</AlertTitle>
        <AlertDescription className="text-[#00A875]">
          O plano está bem estruturado e pronto para uso.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Erros */}
      {validation.errors.length > 0 && (
        <Alert className="border-red-700 bg-red-700/25">
          <AlertTriangle className="h-4 w-4 !text-red-600" />
          <AlertTitle className="text-red-600 font-semibold">Erros encontrados</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-red-600 text-sm">
                  {error.message}
                  {error.fix && (
                    <span className="block text-red-500 text-xs mt-1">
                      💡 {error.fix}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Avisos */}
      {validation.warnings.length > 0 && (
        <Alert className="border-yellow-600 bg-yellow-500/30">
          <Info className="h-4 w-4 !text-yellow-800" />
          <AlertTitle className="text-yellow-800 font-semibold">Avisos</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-900 text-sm">
                  {warning.message}
                  {warning.suggestion && (
                    <span className="block text-yellow-800 text-xs mt-1">
                      💡 {warning.suggestion}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}












