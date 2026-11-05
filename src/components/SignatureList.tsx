import React, { useState } from 'react';
import {
  Search,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  Sheet,
  Check,
  Calendar,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { SignatureRecord } from '../types';
import {
  formatKoreanDateTime,
  exportToCSV,
  copyForGoogleSheets,
  clearAllSignatures,
} from '../utils/storage';

interface SignatureListProps {
  signatures: SignatureRecord[];
  onSelectRecord: (record: SignatureRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAddNewSignature: () => void;
  onOpenSheetsGuide: () => void;
  onRefresh: () => void;
  onAddSampleData?: () => void;
}

export const SignatureList: React.FC<SignatureListProps> = ({
  signatures,
  onSelectRecord,
  onDeleteRecord,
  onAddNewSignature,
  onOpenSheetsGuide,
  onRefresh,
  onAddSampleData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const filtered = signatures.filter((record) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      record.name.toLowerCase().includes(q) ||
      (record.memo && record.memo.toLowerCase().includes(q)) ||
      (record.phone && record.phone.includes(q)) ||
      record.createdAt.includes(q)
    );
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = signatures.filter((s) => s.createdAt.startsWith(todayStr)).length;

  const handleCopySheets = async () => {
    if (signatures.length === 0) return;
    const ok = await copyForGoogleSheets(signatures);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(signatures);
  };

  const handleClearAll = () => {
    if (confirm(`보관 중인 총 ${signatures.length}개의 모든 서명을 영구 삭제하시겠습니까?`)) {
      clearAllSignatures();
      onRefresh();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Local Archive
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-emerald-600 font-medium">로컬 저장소 활성화됨</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              보관된 서명 목록
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              브라우저 로컬 저장소에 안전하게 보관된 서명 내역입니다. (총{' '}
              <strong className="text-slate-900 font-mono">{signatures.length}</strong>건 / 오늘{' '}
              <strong className="text-slate-900 font-mono">{todayCount}</strong>건)
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddNewSignature}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 서명 받기</span>
            </button>

            <button
              type="button"
              onClick={handleCopySheets}
              disabled={signatures.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 text-xs font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="클립보드에 복사하여 구글 시트에서 Ctrl+V 붙여넣기"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">복사됨! 시트에 붙여넣으세요</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-700" />
                  <span>시트용 복사 (Ctrl+V)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={signatures.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="한글 깨짐 없는 UTF-8 BOM CSV 파일 다운로드"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV 내보내기</span>
            </button>

            <button
              type="button"
              onClick={onOpenSheetsGuide}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              title="구글 시트 연동 방법 안내"
            >
              <Sheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">구글 시트 연동 안내</span>
            </button>
          </div>
        </div>

        {/* Search & Utility Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 메모, 날짜 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs text-slate-500">
            {signatures.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                전체 비우기
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* Signatures Grid / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Sheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchTerm ? '검색된 서명이 없습니다' : '아직 보관된 서명이 없습니다'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? '다른 검색어로 검색해 보시거나 검색어를 비워주세요.'
              : '새로운 서명을 받으시거나, 테스트용 샘플 데이터를 추가하여 구글 시트 내보내기를 미리 체험해 보세요.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={onAddNewSignature}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>서명 작성하기</span>
            </button>
            {onAddSampleData && (
              <button
                type="button"
                onClick={onAddSampleData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                샘플 서명 3건 추가
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col group"
            >
              {/* Card Header */}
              <div className="p-4 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50/40">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{record.name}</h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatKoreanDateTime(record.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onSelectRecord(record)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    title="상세 보기"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`'${record.name}' 님의 서명을 삭제하시겠습니까?`)) {
                        onDeleteRecord(record.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Signature Image Box */}
              <div
                onClick={() => onSelectRecord(record)}
                className="h-32 bg-white p-3 flex items-center justify-center cursor-pointer hover:bg-slate-50/50 transition-colors relative"
              >
                <img
                  src={record.signatureDataUrl}
                  alt={`${record.name} 서명`}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              </div>

              {/* Card Footer / Metadata */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 mt-auto flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate max-w-[160px]">
                  {record.memo || record.documentTitle || '확인 서명'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = record.signatureDataUrl;
                    link.download = `서명_${record.name}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>PNG</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
