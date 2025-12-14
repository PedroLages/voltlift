import React, { useState } from 'react';
import { Download, FileText, Database, Calendar, Check, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  downloadWorkoutsCSV,
  downloadPRsCSV,
  downloadBodyMetricsCSV,
  downloadFullBackup,
  generateSummaryStats,
} from '../services/dataExport';
import { haptic } from '../services/haptics';

type ExportType = 'workouts' | 'prs' | 'body' | 'backup';

export const DataExport: React.FC = () => {
  const { history, templates, settings, dailyLogs } = useStore();
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [exported, setExported] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    haptic('medium');
    setExporting(type);

    // Simulate a small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      switch (type) {
        case 'workouts':
          downloadWorkoutsCSV(history);
          break;
        case 'prs':
          downloadPRsCSV(settings.personalRecords);
          break;
        case 'body':
          downloadBodyMetricsCSV(dailyLogs);
          break;
        case 'backup':
          downloadFullBackup({ workouts: history, templates, settings, dailyLogs });
          break;
      }

      setExported(type);
      setTimeout(() => setExported(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  // Get summary stats
  const stats = generateSummaryStats(history);

  const exportOptions = [
    {
      type: 'workouts' as ExportType,
      icon: Calendar,
      title: 'Workout History',
      description: `${stats.totalWorkouts} workouts, ${stats.totalSets} sets`,
      format: 'CSV',
    },
    {
      type: 'prs' as ExportType,
      icon: FileText,
      title: 'Personal Records',
      description: `${Object.keys(settings.personalRecords).length} exercises tracked`,
      format: 'CSV',
    },
    {
      type: 'body' as ExportType,
      icon: FileText,
      title: 'Body Metrics',
      description: `${Object.keys(dailyLogs).length} days logged`,
      format: 'CSV',
    },
    {
      type: 'backup' as ExportType,
      icon: Database,
      title: 'Full Backup',
      description: 'All data including templates',
      format: 'JSON',
    },
  ];

  return (
    <div className="bg-[#111] border border-[#222] p-4">
      <div className="flex items-center gap-2 mb-4">
        <Download size={18} className="text-primary" />
        <h3 className="text-sm font-bold uppercase text-white">Export Data</h3>
      </div>

      <div className="space-y-2">
        {exportOptions.map(option => {
          const Icon = option.icon;
          const isExporting = exporting === option.type;
          const isExported = exported === option.type;

          return (
            <button
              key={option.type}
              onClick={() => handleExport(option.type)}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3 bg-black border border-[#222] hover:border-[#333] transition-colors disabled:opacity-50 active-scale"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                  <Icon size={16} className="text-[#666]" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">{option.title}</div>
                  <div className="text-[10px] text-[#666] font-mono">{option.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#444] font-bold uppercase">{option.format}</span>
                {isExporting ? (
                  <Loader2 size={16} className="text-primary animate-spin" />
                ) : isExported ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Download size={16} className="text-[#666]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-[#444] font-mono mt-3 text-center">
        Data is exported to your device's Downloads folder
      </p>
    </div>
  );
};

export default DataExport;
