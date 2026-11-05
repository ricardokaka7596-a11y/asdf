import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sheet, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface GoogleSheetsGuideModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 첫 행에 제목이 없으면 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "서명일시", "서명자 이름", "연락처", "문서명", "메모", "서명 이미지(DataURL)"]);
    }
    
    // 서명 데이터 행 추가
    sheet.appendRow([
      data.id || "",
      data.timestamp || new Date().toLocaleString(),
      data.name || "",
      data.phone || "",
      data.documentTitle || "",
      data.memo || "",
      data.signatureDataUrl || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(settings.sheetsWebhookUrl || '');
  const [autoSync, setAutoSync] = useState(settings.autoSyncToSheets ?? false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      sheetsWebhookUrl: webhookUrl.trim(),
      autoSyncToSheets: autoSync,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">구글 시트(Google Sheets) 연동 가이드</h3>
              <p className="text-xs text-slate-600">
                수집된 서명을 언제든 구글 스프레드시트로 안전하게 넘길 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Method A */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">
                1
              </span>
              방법 1: 간편 복사 & 붙여넣기 (설정 없이 즉시 가능)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              서명 목록 화면에서 <strong>[시트용 복사]</strong> 버튼을 누른 뒤, 구글 스프레드시트의 <code>A1</code> 셀을 클릭하고 <code>Ctrl + V</code> (붙여넣기)만 하면 즉시 표로 들어갑니다.
            </p>
            <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
              서명일시 / 서명자 이름 / 연락처 / 문서명 / 메모 / 서명상태
            </div>
          </div>

          {/* Real-time Method B */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                2
              </span>
              방법 2: 실시간 자동 전송 웹훅 연동 (추후 필요할 때)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              구글 시트에 서명이 제출되는 즉시 자동으로 한 줄씩 추가되도록 설정할 수 있습니다.
            </p>

            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                새 <strong>구글 스프레드시트</strong>를 열고 상단 메뉴 <strong>[확장 프로그램] → [Apps Script]</strong>를 클릭합니다.
              </li>
              <li>
                아래 코드를 복사하여 기존 내용을 지우고 붙여넣습니다:
              </li>
            </ol>

            {/* Code Box */}
            <div className="relative">
              <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                <code>{APPS_SCRIPT_SNIPPET}</code>
              </pre>
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : '코드 복사'}</span>
              </button>
            </div>

            <ol start={3} className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                우측 상단 <strong>[배포] → [새 배포]</strong> 클릭 후 <strong>유형: 웹 앱</strong> 선택
              </li>
              <li>
                <strong>액세스 권한: 모든 사용자(Anyone)</strong>로 설정 후 [배포]를 누릅니다.
              </li>
              <li>
                생성된 <strong>웹 앱 URL (https://script.google.com/...)</strong>을 아래 입력칸에 붙여넣으시면 완료됩니다!
              </li>
            </ol>

            {/* Webhook URL Input Form */}
            <form onSubmit={handleSave} className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  구글 웹 앱(Apps Script) URL 등록
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                />
                <span className="text-xs text-slate-700">
                  서명 제출 시 구글 시트로 자동 동시 전송 활성화
                </span>
              </label>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  * URL을 등록하지 않아도 로컬 저장 및 CSV/복사 기능은 100% 정상 작동합니다.
                </span>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>저장 완료</span>
                    </>
                  ) : (
                    <span>설정 저장하기</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
