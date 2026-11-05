import React from 'react';
import { CheckCircle2, Download, UserPlus, ListFilter, X, ShieldCheck } from 'lucide-react';
import { SignatureRecord } from '../types';
import { formatKoreanDateTime } from '../utils/storage';

interface SubmissionSuccessModalProps {
  record: SignatureRecord;
  onClose: () => void;
  onNextSign: () => void;
  onViewList: () => void;
}

export const SubmissionSuccessModal: React.FC<SubmissionSuccessModalProps> = ({
  record,
  onClose,
  onNextSign,
  onViewList,
}) => {
  const handleDownloadPng = () => {
    const link = document.createElement('a');
    link.href = record.signatureDataUrl;
    link.download = `서명_${record.name}_${new Date(record.createdAt).getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Status Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">서명 제출 완료</h2>
          <p className="text-xs text-slate-300 mt-1">
            로컬 브라우저 저장소에 정상적으로 저장되었습니다.
          </p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">서명자 성함</span>
              <span className="font-semibold text-slate-900 text-sm">{record.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">서명 일시</span>
              <span className="font-mono text-slate-700">{formatKoreanDateTime(record.createdAt)}</span>
            </div>

            {record.memo && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-slate-500">메모/목적</span>
                <span className="text-slate-800">{record.memo}</span>
              </div>
            )}

            {/* Signature Preview Thumbnail */}
            <div>
              <span className="text-xs text-slate-500 block mb-1.5">서명 사본</span>
              <div className="h-28 w-full bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                <img
                  src={record.signatureDataUrl}
                  alt={`${record.name} 서명`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>고유 ID: {record.id.slice(0, 16)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onNextSign}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>새로운 서명 받기</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG 다운로드</span>
              </button>

              <button
                type="button"
                onClick={onViewList}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>서명 목록 보기</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
