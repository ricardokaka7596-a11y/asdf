import React, { useState, useRef } from 'react';
import { User, FileText, Send, Sparkles, AlertCircle, Phone, MessageSquare } from 'lucide-react';
import { SignaturePad, SignaturePadRef } from './SignaturePad';
import { SignatureRecord, AppSettings } from '../types';
import { saveSignature, syncToGoogleSheetsWebhook } from '../utils/storage';

interface SignatureFormProps {
  settings: AppSettings;
  onSubmitted: (record: SignatureRecord) => void;
  onOpenList?: () => void;
}

export const SignatureForm: React.FC<SignatureFormProps> = ({
  settings,
  onSubmitted,
  onOpenList,
}) => {
  const padRef = useRef<SignaturePadRef>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const [documentTitle, setDocumentTitle] = useState(settings.documentTitle || '전자 서약 및 수기 확인서');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('서명하시는 분의 이름을 입력해 주세요.');
      const nameInput = document.getElementById('signer-name-input');
      nameInput?.focus();
      return;
    }

    if (!padRef.current || padRef.current.isEmpty()) {
      setErrorMsg('서명란에 본인 서명을 직접 작성해 주세요.');
      return;
    }

    const dataUrl = padRef.current.getDataUrl();
    if (!dataUrl) {
      setErrorMsg('서명 이미지를 생성하지 못했습니다. 다시 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newRecord: SignatureRecord = {
        id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        signatureDataUrl: dataUrl,
        createdAt: new Date().toISOString(),
        documentTitle: documentTitle.trim() || '전자 서약 및 수기 확인서',
        phone: phone.trim() || undefined,
        memo: memo.trim() || undefined,
        syncedToSheets: false,
      };

      // 1. Always save to local storage immediately
      saveSignature(newRecord);

      // 2. If user already configured webhook, attempt background sync
      if (settings.sheetsWebhookUrl && settings.autoSyncToSheets) {
        syncToGoogleSheetsWebhook(newRecord, settings.sheetsWebhookUrl).catch(() => {
          // background sync error logged without blocking local completion
        });
      }

      // Reset form fields
      setName('');
      setPhone('');
      setMemo('');
      padRef.current.clear();
      setHasStrokes(false);

      // Callback to show success receipt
      onSubmitted(newRecord);
    } catch (err) {
      console.error(err);
      setErrorMsg('서명 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Signing Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Document Header */}
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Digital Sign-Off
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingTitle(!isEditingTitle)}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              {isEditingTitle ? '완료' : '제목 변경'}
            </button>
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-300 pb-1 focus:outline-none focus:border-slate-800"
              placeholder="문서 제목을 입력하세요"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {documentTitle}
            </h1>
          )}

          <p className="mt-1 text-sm text-slate-500">
            성함을 기재하시고 하단 서명란에 정자로 서명하신 후 제출해 주세요.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Signer Name Input (Primary field) */}
          <div>
            <label
              htmlFor="signer-name-input"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              성함 / 서명자 이름 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                id="signer-name-input"
                type="text"
                required
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="예: 홍길동"
                className="w-full pl-11 pr-10 py-3 text-base text-slate-900 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all placeholder:text-slate-400"
              />
              {name && (
                <button
                  type="button"
                  onClick={() => setName('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="이름 지우기"
                >
                  <span className="text-sm font-medium">✕</span>
                </button>
              )}
            </div>
          </div>

          {/* Optional Fields Toggle (연락처 / 메모) */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>{showOptionalFields ? '− 추가 정보 접기' : '+ 연락처/소속/메모 입력 (선택)'}</span>
            </button>

            {showOptionalFields && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100">
                <div>
                  <label htmlFor="signer-phone-input" className="block text-xs font-medium text-slate-600 mb-1">
                    연락처 (선택)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="signer-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signer-memo-input" className="block text-xs font-medium text-slate-600 mb-1">
                    용도 / 소속 / 메모 (선택)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <input
                      id="signer-memo-input"
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="예: 물품 수령, 교육 참석"
                      className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Signature Canvas Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-800">
                수기 서명 <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">마우스 또는 손가락으로 서명</span>
            </div>

            <SignaturePad
              ref={padRef}
              onStrokeChange={(hasData) => {
                setHasStrokes(hasData);
                if (hasData && errorMsg) setErrorMsg(null);
              }}
              height={220}
            />
          </div>

          {/* Consent Affirmation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span className="text-xs leading-relaxed text-slate-600">
                본인은 위 기재 사항 및 본 서명이 본인의 의사에 의해 정당하게 작성되었음을 확인하며
                동의합니다.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !agreed}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? '저장 중...' : '서명 제출하기'}</span>
            </button>

            {onOpenList && (
              <button
                type="button"
                onClick={onOpenList}
                className="w-full sm:w-auto px-5 py-3.5 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                저장된 서명 목록
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
