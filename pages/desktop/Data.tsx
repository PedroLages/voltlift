import React, { useState } from 'react';
import { Download, Upload, Database, FileJson, Printer, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const DesktopData: React.FC = () => {
  const { history, templates, programs, dailyLogs, settings, resetAllData } = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Export all data to JSON
  const handleExportData = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        history,
        templates,
        programs,
        dailyLogs,
        settings
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltlift-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export workout history as CSV
  const handleExportWorkouts = () => {
    const csvHeader = 'Date,Workout,Duration (min),Exercises,Sets,Total Volume\n';
    const csvRows = history
      .filter(w => w.status === 'completed')
      .map(w => {
        const date = new Date(w.startTime).toISOString().split('T')[0];
        const duration = w.endTime ? Math.floor((w.endTime - w.startTime) / 1000 / 60) : 0;
        const exercises = w.logs.length;
        const sets = w.logs.reduce((sum, log) => sum + log.sets.filter(s => s.completed).length, 0);
        const volume = w.logs.reduce((sum, log) => {
          return sum + log.sets
            .filter(s => s.completed && s.type !== 'W')
            .reduce((setSum, s) => setSum + (s.weight * s.reps), 0);
        }, 0);
        return `${date},"${w.name}",${duration},${exercises},${sets},${volume}`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltlift-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print workout summary
  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  // Calculate data statistics
  const dataSize = JSON.stringify({ history, templates, programs, dailyLogs, settings }).length;
  const dataSizeKB = (dataSize / 1024).toFixed(2);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-white mb-2">DATA MANAGEMENT</h1>
        <p className="text-[#666] font-mono text-sm uppercase tracking-wider">
          Import, export, and manage your training data
        </p>
      </div>

      {/* Data Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
            Workouts
          </div>
          <div className="text-3xl font-black italic text-white">
            {history.filter(w => w.status === 'completed').length}
          </div>
        </div>
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
            Templates
          </div>
          <div className="text-3xl font-black italic text-white">{templates.length}</div>
        </div>
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
            Programs
          </div>
          <div className="text-3xl font-black italic text-white">{programs.length}</div>
        </div>
        <div className="bg-[#111] border border-[#222] p-6">
          <div className="text-[10px] text-[#666] uppercase font-bold tracking-widest mb-2">
            Data Size
          </div>
          <div className="text-3xl font-black italic text-white">{dataSizeKB}</div>
          <div className="text-xs text-[#666] font-mono">KB</div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-[#111] border border-[#222] p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Download size={20} className="text-primary" />
          <h2 className="text-lg font-black uppercase text-white">Export Data</h2>
        </div>
        <p className="text-sm text-[#888] mb-6">
          Download your workout data in various formats for backup or analysis
        </p>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] border border-[#333] text-white font-bold uppercase text-sm hover:bg-[#222] transition-colors"
          >
            <FileJson size={18} />
            <div className="text-left">
              <div>Full Backup (JSON)</div>
              <div className="text-[10px] text-[#666] font-mono normal-case">All data</div>
            </div>
          </button>
          <button
            onClick={handleExportWorkouts}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] border border-[#333] text-white font-bold uppercase text-sm hover:bg-[#222] transition-colors"
          >
            <Database size={18} />
            <div className="text-left">
              <div>Workout History (CSV)</div>
              <div className="text-[10px] text-[#666] font-mono normal-case">For spreadsheets</div>
            </div>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1a1a1a] border border-[#333] text-white font-bold uppercase text-sm hover:bg-[#222] transition-colors"
          >
            <Printer size={18} />
            <div className="text-left">
              <div>Print Summary</div>
              <div className="text-[10px] text-[#666] font-mono normal-case">PDF/Print</div>
            </div>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-[#111] border border-[#222] p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-primary" />
          <h2 className="text-lg font-black uppercase text-white">Import Data</h2>
        </div>
        <p className="text-sm text-[#888] mb-4">
          Restore data from a previous backup
        </p>
        <div className="bg-[#1a1a1a] border border-[#333] p-6 text-center">
          <Upload size={32} className="text-[#666] mx-auto mb-3" />
          <p className="text-sm text-[#666] mb-3">Coming soon</p>
          <p className="text-xs text-[#444] font-mono">
            Import functionality will be available in a future update
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111] border border-red-900/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-red-500" />
          <h2 className="text-lg font-black uppercase text-white">Danger Zone</h2>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#888] mb-2">
              Reset all workout data, templates, programs, and body metrics. This action cannot be undone.
            </p>
            <p className="text-xs text-[#666] font-mono">
              Your account and basic settings will be preserved.
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-6 py-3 bg-red-900/20 border border-red-900 text-red-500 font-bold uppercase text-sm hover:bg-red-900/40 transition-colors ml-6"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] border-2 border-red-900 max-w-md w-full">
            <div className="p-6 border-b border-red-900/30">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-500" />
                <h3 className="text-xl font-black uppercase text-white">Confirm Reset</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-white mb-4">
                Are you absolutely sure you want to reset all data? This will permanently delete:
              </p>
              <ul className="space-y-2 mb-6 text-sm text-[#888]">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>All workout history ({history.filter(w => w.status === 'completed').length} workouts)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>All workout templates ({templates.length} templates)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>All programs ({programs.length} programs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Body metrics and progress photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>All personal records</span>
                </li>
              </ul>
              <p className="text-xs text-red-500 font-bold mb-6">
                THIS ACTION CANNOT BE UNDONE
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-6 py-3 bg-[#222] text-white font-bold uppercase text-sm border border-[#333] hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-red-900 text-white font-bold uppercase text-sm hover:bg-red-800 transition-colors"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopData;
