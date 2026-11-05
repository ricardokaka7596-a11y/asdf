import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Archive,
  Sheet,
  Plus,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { SignatureRecord, AppSettings } from './types';
import {
  loadSignatures,
  loadSettings,
  saveSettings,
  deleteSignature,
  saveSignature,
  exportToCSV,
} from './utils/storage';
import { getSampleSignatures } from './utils/sampleData';
import { SignatureForm } from './components/SignatureForm';
import { SignatureList } from './components/SignatureList';
import { SubmissionSuccessModal } from './components/SubmissionSuccessModal';
import { SignatureDetailModal } from './components/SignatureDetailModal';
import { GoogleSheetsGuideModal } from './components/GoogleSheetsGuideModal';

type AppTab = 'sign' | 'list';

export default function App() {
  const [tab, setTab] = useState<AppTab>('sign');
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [latestSubmitted, setLatestSubmitted] = useState<SignatureRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SignatureRecord | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Load signatures on mount
  useEffect(() => {
    const loaded = loadSignatures();
    setSignatures(loaded);
  }, []);

  const refreshSignatures = () => {
    setSignatures(loadSignatures());
  };

  const handleSubmitted = (record: SignatureRecord) => {
    setSignatures((prev) => [record, ...prev]);
    setLatestSubmitted(record);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteSignature(id);
    setSignatures(updated);
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  };

  const handleAddSampleData = () => {
    const samples = getSampleSignatures();
    samples.forEach((s) => saveSignature(s));
    refreshSignatures();
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar following Top Bar Contract: Brand — Nav links — 1 primary action */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setTab('sign')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm group-hover:bg-slate-800 transition-colors">
              <PenTool className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                사인패드
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                SIGN-PAD LOCAL
              </span>
            </div>
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => setTab('sign')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
                tab === 'sign'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>서명 받기</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
                tab === 'list'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>보관함 ({signatures.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Sheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">구글 시트 연동</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="이용 안내"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>안내</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            {tab === 'list' ? (
              <button
                type="button"
                onClick={() => setTab('sign')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 서명 받기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTab('list')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>보관함 ({signatures.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Optional Help Banner */}
      {isHelpOpen && (
        <div className="bg-slate-900 text-slate-200 py-3 px-4 border-b border-slate-800 text-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded font-semibold text-[11px]">
                TIP
              </span>
              <span>
                모든 서명은 브라우저 로컬 저장소에 즉시 보관됩니다. 상단 <strong>[구글 시트 연동]</strong>에서 엑셀/시트용 CSV 다운로드 및 1초 복사(Ctrl+V)를 지원합니다.
              </span>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {tab === 'sign' ? (
          <div>
            <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>로컬 저장 모드 활성 (서버 전송 없음, 기기 단독 저장)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetsModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
              >
                <Sheet className="w-3 h-3 text-emerald-600" />
                <span>추후 구글 시트 연결 안내</span>
              </button>
            </div>

            <SignatureForm
              settings={settings}
              onSubmitted={handleSubmitted}
              onOpenList={() => setTab('list')}
            />
          </div>
        ) : (
          <SignatureList
            signatures={signatures}
            onSelectRecord={(r) => setSelectedRecord(r)}
            onDeleteRecord={handleDeleteRecord}
            onAddNewSignature={() => setTab('sign')}
            onOpenSheetsGuide={() => setIsSheetsModalOpen(true)}
            onRefresh={refreshSignatures}
            onAddSampleData={handleAddSampleData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>개인정보 로컬 보관 중 · 외부 유출 없음</span>
          </div>
          <div>
            <span>간편 전자 서명 솔루션 · 추후 구글 시트 연동 지원</span>
          </div>
        </div>
      </footer>

      {/* Success Modal after Submission */}
      {latestSubmitted && (
        <SubmissionSuccessModal
          record={latestSubmitted}
          onClose={() => setLatestSubmitted(null)}
          onNextSign={() => {
            setLatestSubmitted(null);
            setTab('sign');
          }}
          onViewList={() => {
            setLatestSubmitted(null);
            setTab('list');
          }}
        />
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <SignatureDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={handleDeleteRecord}
        />
      )}

      {/* Google Sheets Guide & Webhook Modal */}
      {isSheetsModalOpen && (
        <GoogleSheetsGuideModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSheetsModalOpen(false)}
        />
      )}
    </div>
  );
}
