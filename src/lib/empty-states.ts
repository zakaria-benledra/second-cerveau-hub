import { ListTodo, Sparkles, BookOpen, Target, Wallet, Calendar } from 'lucide-react';

export const emptyStateMessages = {
  tasks: {
    icon: ListTodo,
    title: "Pas de tâches pour le moment",
    description: "C'est calme ici ! Ajoute une tâche pour commencer ta journée.",
    actionLabel: "Ajouter une tâche",
  },
  habits: {
    icon: Sparkles,
    title: "Aucune habitude définie",
    description: "Les habitudes construisent qui tu deviens. Commence par en créer une !",
    actionLabel: "Créer une habitude",
  },
  journal: {
    icon: BookOpen,
    title: "Ton journal est vide",
    description: "Prends un moment pour écrire ce qui te passe par la tête.",
    actionLabel: "Écrire une entrée",
  },
  goals: {
    icon: Target,
    title: "Pas d'objectifs définis",
    description: "Tes objectifs dessinent ton futur. Où veux-tu aller ?",
    actionLabel: "Définir un objectif",
  },
  finance: {
    icon: Wallet,
    title: "Aucune transaction",
    description: "Commence à suivre tes finances pour mieux les maîtriser.",
    actionLabel: "Ajouter une transaction",
  },
  calendar: {
    icon: Calendar,
    title: "Calendrier vide",
    description: "Planifie tes événements pour rester organisé.",
    actionLabel: "Ajouter un événement",
  },
};
