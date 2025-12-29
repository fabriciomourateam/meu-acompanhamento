import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  children: React.ReactNode;
  loading?: boolean;
}

export function ConfirmationDialog({
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  children,
  loading = false
}: ConfirmationDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {variant === "destructive" ? (
              <AlertTriangle className="w-5 h-5 text-danger" />
            ) : null}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-surface border-border hover:bg-surface-hover">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              variant === "destructive"
                ? "bg-danger hover:bg-danger-hover text-danger-foreground"
                : "bg-primary hover:bg-primary-hover"
            }
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                {variant === "destructive" ? <Trash2 className="w-4 h-4 mr-2" /> : null}
                {confirmText}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Componente específico para exclusão
interface DeleteConfirmationProps {
  itemName: string;
  itemType: string;
  onConfirm: () => void;
  children: React.ReactNode;
  loading?: boolean;
}

export function DeleteConfirmation({
  itemName,
  itemType,
  onConfirm,
  children,
  loading = false
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      title={`Excluir ${itemType}`}
      description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`}
      confirmText="Sim, excluir"
      cancelText="Cancelar"
      variant="destructive"
      onConfirm={onConfirm}
      loading={loading}
    >
      {children}
    </ConfirmationDialog>
  );
}