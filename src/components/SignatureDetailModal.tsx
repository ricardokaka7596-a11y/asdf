import React from 'react';
import { X, Download, Trash2, Calendar, User, FileText, Phone, Hash } from 'lucide-react';
import { SignatureRecord } from '../types';
import { formatKoreanDateTime } from '../utils/storage';

interface SignatureDetailModalProps {
  record: SignatureRecord;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const SignatureDetailModal: React.FC<SignatureDetailModalProps> = ({
  record,
  onClose,
  onDelete,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = record.signatureDataUrl;
    link.download = `서명_${record.name}_${new Date(record.createdAt).getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (confirm(`'${record.name}' 님의 서명 기록을 영구 삭제하시겠습니까?`)) {
      onDelete(record.id);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">서명 상세 내역</h3>
            <p className="text-xs text-slate-500">기록 번호: {record.id.slice(0, 14)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" />
                서명자
              </span>
              <span className="text-sm font-semibold text-slate-900">{record.name}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                서명 일시
              </span>
              <span className="text-xs font-mono text-slate-800">
                {formatKoreanDateTime(record.createdAt)}
              </span>
            </div>

            {record.phone && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  연락처
                </span>
                <span className="text-xs text-slate-800">{record.phone}</span>
              </div>
            )}

            {record.memo && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  용도/메모
                </span>
                <span className="text-xs text-slate-800">{record.memo}</span>
              </div>
            )}
          </div>

          {/* Signature Viewer Canvas */}
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">서명 원본</span>
            <div className="w-full h-48 bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center justify-center shadow-inner relative">
              <img
                src={record.signatureDataUrl}
                alt={`${record.name} 서명`}
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                Digital Verification
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>기록 삭제</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
