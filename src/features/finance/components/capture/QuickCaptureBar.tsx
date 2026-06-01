import { Check, CornerDownLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { CaptureContext, CaptureDraft } from '../../capture/types';
import type { CaptureExecutorActions } from '../../capture/executor';
import { executeCaptureDraft } from '../../capture/executor';
import { parseCaptureInput } from '../../capture/parser';
import { rememberCaptureDraft } from '../../capture/preferences';
import { buildCapturePreview } from '../../capture/previewBuilder';
import { buildCaptureSuggestions } from '../../capture/suggestions';
import { parseReceiptCaptureSource, readReceiptFile } from '../../capture/ocr/receiptParser';
import { recordCaptureMetric } from '../../capture/metrics';

interface QuickCaptureBarProps {
  captureContext: CaptureContext;
  executorActions: CaptureExecutorActions;
  onReview: (draft: CaptureDraft) => void;
  onSaved?: (draft: CaptureDraft) => void;
  resetSignal?: number;
}

export function QuickCaptureBar({
  captureContext,
  executorActions,
  onReview,
  onSaved,
  resetSignal,
}: QuickCaptureBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'saved' | 'blocked' | 'reading'>('idle');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const result = useMemo(
    () => (value.trim() ? parseCaptureInput(value, captureContext) : null),
    [captureContext, value]
  );
  const preview = result ? buildCapturePreview(result.draft) : null;
  const suggestions = result ? buildCaptureSuggestions(result.draft, captureContext) : [];
  const canExecuteDirectly =
    result?.draft.confidence === 'high' &&
    preview?.canExecute === true &&
    result.draft.warnings.length === 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setValue('');
        setStatus('idle');
        setCaptureError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) return;
    setValue('');
    setStatus('idle');
    setCaptureError(null);
    inputRef.current?.focus();
  }, [resetSignal]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result) return;

    if (!canExecuteDirectly) {
      setStatus('blocked');
      recordCaptureMetric('reviewed', result.draft.intent);
      onReview(result.draft);
      return;
    }

    const execution = await executeCaptureDraft(
      result.draft,
      { currentMonthKey: captureContext.currentMonthKey, cards: captureContext.cards },
      executorActions
    );

    if (execution.executed) {
      rememberCaptureDraft(result.draft);
      recordCaptureMetric('saved', result.draft.intent);
      onSaved?.(result.draft);
      setValue('');
      setStatus('saved');
      inputRef.current?.focus();
      window.setTimeout(() => setStatus('idle'), 1400);
      return;
    }

    setStatus('blocked');
    recordCaptureMetric('reviewed', result.draft.intent);
    onReview(result.draft);
  };

  const readReceipt = async (file: File) => {
    setStatus('reading');
    setCaptureError(null);

    try {
      const source = await readReceiptFile(file);
      const parsedReceipt = parseReceiptCaptureSource(source, captureContext);
      const [draft] = parsedReceipt.drafts;

      if (!draft) {
        setStatus('blocked');
        setCaptureError(
          parsedReceipt.warnings[0] || 'Nao consegui identificar os dados do arquivo.'
        );
        return;
      }

      setStatus('blocked');
      recordCaptureMetric('reviewed', draft.intent);
      onReview(draft);
    } catch (error) {
      setStatus('blocked');
      setCaptureError(
        error instanceof Error
          ? error.message
          : 'Nao consegui ler este arquivo. Tente XML da NF-e, PDF com texto, TXT ou imagem nitida.'
      );
    } finally {
      if (receiptInputRef.current) {
        receiptInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="quick-capture" aria-label="Captura rapida">
      <form className="quick-capture-form" onSubmit={submit}>
        <label className="quick-capture-field">
          <span className="sr-only">Adicionar rapidamente</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => {
              setStatus('idle');
              setCaptureError(null);
              setValue(event.target.value);
            }}
            placeholder='Adicionar: "mercado 123,45"'
            title="Ctrl/Cmd+K"
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={!value.trim()}>
          <CornerDownLeft size={14} strokeWidth={2.2} aria-hidden />
          Capturar
        </button>
        <button type="button" onClick={() => receiptInputRef.current?.click()}>
          Cupom
        </button>
        <input
          ref={receiptInputRef}
          className="sr-only"
          type="file"
          accept="image/*,.txt,text/plain,.xml,application/xml,text/xml,.pdf,application/pdf"
          onChange={(event) => {
            const [file] = Array.from(event.target.files || []);
            if (file) void readReceipt(file);
          }}
        />
      </form>

      {preview ? (
        <div className="quick-capture-preview" aria-live="polite">
          <div>
            <strong>{preview.title}</strong>
            <span>{preview.summary}</span>
          </div>
          <div className="quick-capture-preview-side">
            <small>
              {canExecuteDirectly ? 'Enter salva direto.' : 'Precisa revisar antes de salvar.'}
            </small>
            {suggestions.length ? (
              <div className="quick-capture-suggestions" aria-label="Sugestoes de captura">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    title={suggestion.detail}
                    onClick={() => {
                      setStatus('blocked');
                      onReview(suggestion.draft);
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {status === 'saved' ? (
        <p className="quick-capture-status">
          <Check size={13} strokeWidth={2.4} aria-hidden />
          Salvo
        </p>
      ) : null}
      {status === 'blocked' ? (
        <p className="quick-capture-status quick-capture-status--blocked">
          {captureError || 'Revisao necessaria'}
        </p>
      ) : null}
      {status === 'reading' ? (
        <p className="quick-capture-status quick-capture-status--blocked">Lendo cupom</p>
      ) : null}
    </section>
  );
}
