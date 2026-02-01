import { toast } from "@/hooks/use-toast";

export const toastSuccess = (title: string, description?: string) => {
  toast({
    title: `${title} ✅`,
    description,
    className: "bg-success/10 border-success/20 text-success-foreground",
    duration: 3000,
  });
};

export const toastError = (title: string = "Oups ! 😅", description: string = "Quelque chose s'est mal passé. Réessaie !") => {
  toast({
    title,
    description,
    variant: "destructive",
    duration: 4000,
  });
};

export const toastInfo = (title: string, description?: string) => {
  toast({
    title: `${title} 💡`,
    description,
    className: "bg-primary/10 border-primary/20 text-primary-foreground",
    duration: 3000,
  });
};

export const toastCelebration = (title: string, description?: string) => {
  toast({
    title: `${title} 🎉`,
    description,
    className: "bg-accent/10 border-accent/20 text-accent-foreground",
    duration: 4000,
  });
};
