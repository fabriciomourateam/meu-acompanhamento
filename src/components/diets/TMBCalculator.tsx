import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TMBCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyMacros: (macros: {
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gorduras: number;
  }) => void;
  patientData?: {
    peso?: number;
    altura?: number;
    idade?: number;
    sexo?: "M" | "F";
  };
}

/**
 * Calcula TMB usando a fórmula de Harris-Benedict
 * Homens: TMB = 88.362 + (13.397 × peso em kg) + (4.799 × altura em cm) - (5.677 × idade em anos)
 * Mulheres: TMB = 447.593 + (9.247 × peso em kg) + (3.098 × altura em cm) - (4.330 × idade em anos)
 */
const calcularTMBHarrisBenedict = (
  peso: number,
  altura: number,
  idade: number,
  sexo: "M" | "F"
): number => {
  if (sexo === "M") {
    return 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade;
  } else {
    return 447.593 + 9.247 * peso + 3.098 * altura - 4.330 * idade;
  }
};

export function TMBCalculator({
  open,
  onOpenChange,
  onApplyMacros,
  patientData,
}: TMBCalculatorProps) {
  const { toast } = useToast();
  const [calculoDados, setCalculoDados] = useState({
    peso: patientData?.peso?.toString() || "",
    altura: patientData?.altura?.toString() || "",
    idade: patientData?.idade?.toString() || "",
    sexo: (patientData?.sexo || "M") as "M" | "F",
  });
  const [resultadoTMB, setResultadoTMB] = useState<number | null>(null);
  const [resultadoGET, setResultadoGET] = useState<number | null>(null);
  const [macrosCalculados, setMacrosCalculados] = useState<{
    calorias: number;
    proteinas: number;
    carboidratos: number;
    gorduras: number;
  } | null>(null);

  const calcularTMBEMacros = () => {
    const peso = parseFloat(calculoDados.peso);
    const altura = parseFloat(calculoDados.altura);
    const idade = parseFloat(calculoDados.idade);
    const sexo = calculoDados.sexo;

    if (!peso || !altura || !idade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Calcular TMB usando Harris-Benedict
    const tmb = calcularTMBHarrisBenedict(peso, altura, idade, sexo);
    // GET = TMB × 1.45 (fator de atividade)
    const get = tmb * 1.45;

    setResultadoTMB(tmb);
    setResultadoGET(get);

    // Calcular macros baseados nas proporções
    // Proteína: 2g/kg
    const proteinasMeta = peso * 2;

    // Gordura: 0.5g/kg
    const gordurasMeta = peso * 0.5;

    // Calorias de proteína (4 kcal/g) e gordura (9 kcal/g)
    const caloriasProteinas = proteinasMeta * 4;
    const caloriasGorduras = gordurasMeta * 9;

    // Carboidratos: o restante das calorias
    const caloriasCarboidratos = get - caloriasProteinas - caloriasGorduras;
    const carboidratosMeta = Math.max(0, caloriasCarboidratos / 4); // 4 kcal/g

    // Armazenar macros calculados
    setMacrosCalculados({
      calorias: Math.round(get),
      proteinas: Math.round(proteinasMeta * 10) / 10,
      carboidratos: Math.round(carboidratosMeta * 10) / 10,
      gorduras: Math.round(gordurasMeta * 10) / 10,
    });
  };

  const aplicarMacros = () => {
    if (!macrosCalculados) {
      toast({
        title: "Erro",
        description: "Calcule os macros primeiro",
        variant: "destructive",
      });
      return;
    }

    onApplyMacros(macrosCalculados);
    onOpenChange(false);
    setResultadoTMB(null);
    setResultadoGET(null);
    setMacrosCalculados(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-green-500/30 bg-white text-[#222222] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#222222] text-xl flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#00C98A]" />
            Calculadora TMB e GET (Harris-Benedict)
          </DialogTitle>
          <DialogDescription className="text-[#777777]">
            Calcule o TMB (Taxa Metabólica Basal) e GET (Gasto Energético Total) do paciente usando a fórmula de Harris-Benedict
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#222222]">Peso (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                value={calculoDados.peso}
                onChange={(e) =>
                  setCalculoDados({ ...calculoDados, peso: e.target.value })
                }
                placeholder="Ex: 75.5"
                className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
              />
            </div>
            <div>
              <Label className="text-[#222222]">Altura (cm) *</Label>
              <Input
                type="number"
                value={calculoDados.altura}
                onChange={(e) =>
                  setCalculoDados({ ...calculoDados, altura: e.target.value })
                }
                placeholder="Ex: 175"
                className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#222222]">Idade *</Label>
              <Input
                type="number"
                value={calculoDados.idade}
                onChange={(e) =>
                  setCalculoDados({ ...calculoDados, idade: e.target.value })
                }
                placeholder="Ex: 30"
                className="border-green-500/30 bg-green-500/10 text-[#222222] placeholder:text-[#777777] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
              />
            </div>
            <div>
              <Label className="text-[#222222]">Sexo *</Label>
              <Select
                value={calculoDados.sexo}
                onValueChange={(value: "M" | "F") =>
                  setCalculoDados({ ...calculoDados, sexo: value })
                }
              >
                <SelectTrigger className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="M" className="text-[#222222]">Masculino</SelectItem>
                  <SelectItem value="F" className="text-[#222222]">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão Calcular */}
          <div className="flex justify-end">
            <Button
              onClick={calcularTMBEMacros}
              className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calcular TMB/GET
            </Button>
          </div>

          {/* Resultados do TMB/GET */}
          {(resultadoTMB || resultadoGET) && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#777777]">TMB (Taxa Metabólica Basal)</p>
                  <p className="text-2xl font-bold text-[#00A875]">
                    {resultadoTMB?.toFixed(2)} kcal
                  </p>
                  <p className="text-xs text-[#777777] mt-1">Fórmula Harris-Benedict</p>
                </div>
                <div>
                  <p className="text-xs text-[#777777]">GET (Gasto Energético Total)</p>
                  <p className="text-2xl font-bold text-[#00A875]">
                    {resultadoGET?.toFixed(2)} kcal
                  </p>
                  <p className="text-xs text-[#777777] mt-1">TMB × 1.45 (Fator de Atividade)</p>
                </div>
              </div>
            </div>
          )}

          {/* Campos de Metas - Aparecem após calcular */}
          {macrosCalculados && (
            <div className="space-y-4 pt-4 border-t border-green-500/30">
              <p className="text-sm font-semibold text-[#222222]">Metas da Dieta</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#222222]">Calorias Meta</Label>
                  <Input
                    type="number"
                    value={macrosCalculados.calorias}
                    onChange={(e) => {
                      const novasCalorias = parseFloat(e.target.value) || 0;
                      const peso = parseFloat(calculoDados.peso) || 0;

                      if (peso > 0 && novasCalorias > 0) {
                        // Recalcular apenas carboidratos mantendo proteína e gordura fixos
                        const proteinasMeta = peso * 2;
                        const gordurasMeta = peso * 0.5;
                        const caloriasProteinas = proteinasMeta * 4;
                        const caloriasGorduras = gordurasMeta * 9;
                        const caloriasCarboidratos =
                          novasCalorias - caloriasProteinas - caloriasGorduras;
                        const carboidratosMeta = Math.max(0, caloriasCarboidratos / 4);

                        setMacrosCalculados({
                          calorias: novasCalorias,
                          proteinas: Math.round(proteinasMeta * 10) / 10,
                          carboidratos: Math.round(carboidratosMeta * 10) / 10,
                          gorduras: Math.round(gordurasMeta * 10) / 10,
                        });
                      } else {
                        setMacrosCalculados({
                          ...macrosCalculados,
                          calorias: novasCalorias,
                        });
                      }
                    }}
                    className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                  />
                </div>
                <div>
                  <Label className="text-[#222222]">Proteínas Meta (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={macrosCalculados.proteinas}
                    onChange={(e) =>
                      setMacrosCalculados({
                        ...macrosCalculados,
                        proteinas: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                  />
                </div>
                <div>
                  <Label className="text-[#222222]">Carboidratos Meta (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={macrosCalculados.carboidratos}
                    onChange={(e) =>
                      setMacrosCalculados({
                        ...macrosCalculados,
                        carboidratos: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                  />
                </div>
                <div>
                  <Label className="text-[#222222]">Gorduras Meta (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={macrosCalculados.gorduras}
                    onChange={(e) =>
                      setMacrosCalculados({
                        ...macrosCalculados,
                        gorduras: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border-green-500/30 bg-green-500/10 text-[#222222] focus:border-green-500 focus:ring-green-500/10 focus:bg-green-500/15"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-green-500/30">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setResultadoTMB(null);
              setResultadoGET(null);
              setMacrosCalculados(null);
            }}
            className="border-gray-300 text-white hover:bg-gray-100 hover:text-[#222222]"
          >
            Cancelar
          </Button>
          {macrosCalculados && (
            <Button
              onClick={aplicarMacros}
              className="bg-[#00C98A] hover:bg-[#00A875] text-white shadow-lg"
            >
              <Save className="mr-2 h-4 w-4" />
              Aplicar Metas
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


