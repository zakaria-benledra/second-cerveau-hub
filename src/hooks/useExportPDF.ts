import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportPeriod = '7d' | '30d' | '90d' | 'all';

function getDateRange(period: ExportPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'all':
      start.setFullYear(2020);
      break;
  }
  
  return { start, end };
}

export function useExportPDF() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (period: ExportPeriod) => {
      if (!user) throw new Error('Not authenticated');

      const { start } = getDateRange(period);
      const startDate = start.toISOString().split('T')[0];

      // Fetch data in parallel
      const [profileRes, scoresRes, habitsRes, journalRes, winsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('scores_daily').select('*').eq('user_id', user.id).gte('date', startDate).order('date', { ascending: false }),
        supabase.from('habits').select('id, name, habit_logs(completed, date)').eq('user_id', user.id).is('deleted_at', null),
        supabase.from('journal_entries').select('mood, created_at').eq('user_id', user.id).gte('created_at', start.toISOString()).order('created_at', { ascending: false }),
        supabase.from('wins').select('title, category, created_at').eq('user_id', user.id).gte('created_at', start.toISOString()),
      ]);

      const profile = profileRes.data;
      const scores = scoresRes.data || [];
      const habits = habitsRes.data || [];
      const journal = journalRes.data || [];
      const wins = winsRes.data || [];

      // Calculate statistics
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((acc, s) => acc + (s.global_score || 0), 0) / scores.length)
        : 0;

      const habitStats = habits.map(h => {
        const logs = (h.habit_logs as any[]) || [];
        const completed = logs.filter(l => l.completed).length;
        return {
          name: h.name,
          completionRate: logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0,
          total: logs.length,
          completed,
        };
      }).sort((a, b) => b.completionRate - a.completionRate);

      const moodAvg = journal.length > 0
        ? Math.round(journal.reduce((acc, j) => {
            const moodValue = typeof j.mood === 'number' ? j.mood : parseInt(String(j.mood), 10) || 50;
            return acc + moodValue;
          }, 0) / journal.length)
        : null;

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241);
      doc.text('Minded', 20, 25);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Rapport Comportemental', 20, 35);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 42);
      doc.text(`Période : ${period === 'all' ? 'Tout l\'historique' : `${period.replace('d', ' derniers jours')}`}`, 20, 48);

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 52, 190, 52);

      // Profile Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('👤 Profil', 20, 62);
      
      doc.setFontSize(10);
      doc.text(`Nom : ${profile?.first_name || profile?.display_name || 'Non renseigné'}`, 25, 70);
      doc.text(`Email : ${user.email}`, 25, 76);
      doc.text(`Membre depuis : ${new Date(user.created_at || '').toLocaleDateString('fr-FR')}`, 25, 82);

      // Scores Section
      doc.setFontSize(14);
      doc.text('📊 Scores Moyens', 20, 95);

      const latestScore = scores[0];
      const oldestScore = scores[scores.length - 1];
      const trend = latestScore && oldestScore && scores.length > 1
        ? (latestScore.global_score ?? 0) > (oldestScore.global_score ?? 0) ? '↑ Hausse' : '↓ Baisse'
        : '-';

      autoTable(doc, {
        startY: 100,
        head: [['Métrique', 'Score', 'Tendance']],
        body: [
          ['Score Global', `${avgScore}%`, trend],
          ['Momentum', `${latestScore?.momentum_index ?? '-'}%`, '-'],
          ['Données analysées', `${scores.length} jours`, '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Habits Section
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('🎯 Top Habitudes', 20, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Habitude', 'Complétion', 'Réalisées']],
        body: habitStats.slice(0, 5).map(h => [
          h.name,
          `${h.completionRate}%`,
          `${h.completed}/${h.total}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Journal & Mood Section
      const finalY2 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('📝 Bien-être & Journal', 20, finalY2);
      
      doc.setFontSize(10);
      doc.text(`Entrées journal : ${journal.length}`, 25, finalY2 + 8);
      doc.text(`Humeur moyenne : ${moodAvg !== null ? `${moodAvg}/100` : 'Non disponible'}`, 25, finalY2 + 14);
      doc.text(`Victoires enregistrées : ${wins.length}`, 25, finalY2 + 20);

      // Recommendations Section
      const finalY3 = finalY2 + 35;
      doc.setFontSize(14);
      doc.text('💡 Recommandations', 20, finalY3);
      
      doc.setFontSize(10);
      const recommendations: string[] = [];
      
      if (avgScore < 50) {
        recommendations.push("Concentre-toi sur 2-3 habitudes clés plutôt que trop à la fois");
      } else if (avgScore >= 70) {
        recommendations.push("Excellent travail ! Continue sur cette lancée");
      } else {
        recommendations.push("Tu progresses bien, reste constant");
      }
      
      if (habitStats[0]?.completionRate < 70) {
        recommendations.push("Renforce ton habitude principale avant d'en ajouter de nouvelles");
      } else {
        recommendations.push("Tes habitudes principales sont solides");
      }
      
      if (journal.length < 5) {
        recommendations.push("Utilise davantage le journal pour suivre ton évolution");
      } else {
        recommendations.push("Continue à documenter tes réflexions dans le journal");
      }
      
      recommendations.forEach((rec, i) => {
        doc.text(`• ${rec}`, 25, finalY3 + 8 + (i * 7));
      });

      // Summary Box
      const summaryY = finalY3 + 40;
      doc.setDrawColor(99, 102, 241);
      doc.setFillColor(245, 245, 255);
      doc.roundedRect(20, summaryY, 170, 25, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(99, 102, 241);
      doc.text('Résumé', 25, summaryY + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Score moyen: ${avgScore}% | Habitudes: ${habits.length} | Entrées: ${journal.length} | Victoires: ${wins.length}`, 25, summaryY + 18);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Généré par Minded — Ton coach comportemental personnel', 20, 285);
      doc.text(`Page 1/1`, 180, 285);

      // Download
      const filename = `minded-rapport-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      return { filename };
    },
  });
}
