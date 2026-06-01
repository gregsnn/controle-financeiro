import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { executeCaptureDraft, type CaptureExecutorActions } from '../../capture/executor';
import { recordCaptureMetric } from '../../capture/metrics';
import { rememberCaptureDraft } from '../../capture/preferences';
import type {
  CaptureContext,
  CaptureDraft,
  CaptureFields,
  CaptureIntent,
} from '../../capture/types';
import { buildCapturePreview } from '../../capture/previewBuilder';
import { ModalShell } from '../modals';

interface CaptureReviewModalProps {
  draft: CaptureDraft | null;
  captureContext: CaptureContext;
  executorActions: CaptureExecutorActions;
  onClose: () => void;
  onSaved: (draft: CaptureDraft) => void;
  onSavedAndAddAnother: (draft: CaptureDraft) => void;
}

const INTENT_OPTIONS: Array<{ value: CaptureIntent; label: string }> = [
  { value: 'variableExpense', label: 'Despesa variavel' },
  { value: 'fixedExpense', label: 'Despesa fixa' },
  { value: 'installment', label: 'Parcelamento' },
  { value: 'revenue', label: 'Receita' },
  { value: 'cardBill', label: 'Fatura de cartao' },
  { value: 'markAsPaid', label: 'Marcar como pago' },
];

function requiredFields(intent: CaptureIntent, fields: CaptureFields) {
  const missing: string[] = [];

  if (intent === 'unknown') missing.push('intent');
  if (!['markAsPaid', 'unknown'].includes(intent) && !fields.amount) missing.push('amount');
  if (!['cardBill', 'markAsPaid', 'unknown'].includes(intent) && !fields.description) {
    missing.push('description');
  }
  if (['installment', 'cardBill'].includes(intent) && !fields.card) {
    missing.push('card');
  }
  if (intent === 'markAsPaid' && !fields.card && !fields.paymentTarget) missing.push('target');
  if (intent === 'fixedExpense' && !fields.day) missing.push('day');
  if (intent === 'installment' && !fields.totalInstallments) missing.push('totalInstallments');

  return missing;
}

function normalizeFields(fields: CaptureFields): CaptureFields {
  return {
    ...fields,
    amount: fields.amount ? Number(fields.amount) : undefined,
    day: fields.day ? Number(fields.day) : undefined,
    totalInstallments: fields.totalInstallments ? Number(fields.totalInstallments) : undefined,
    recurring: fields.recurring === true || fields.recurring === 'true',
  };
}

export function CaptureReviewModal({
  draft,
  captureContext,
  executorActions,
  onClose,
  onSaved,
  onSavedAndAddAnother,
}: CaptureReviewModalProps) {
  const [intent, setIntent] = useState<CaptureIntent>('unknown');
  const [fields, setFields] = useState<CaptureFields>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!draft) return;
    setIntent(
      draft.intent === 'unknown' ? draft.alternatives[0] || 'variableExpense' : draft.intent
    );
    setFields(draft.fields);
    setError('');
  }, [draft]);

  const editedDraft = useMemo<CaptureDraft | null>(() => {
    if (!draft) return null;
    const normalizedFields = normalizeFields(fields);
    const missingFields = requiredFields(intent, normalizedFields);
    return {
      ...draft,
      intent,
      fields: normalizedFields,
      missingFields,
      warnings: missingFields.length ? ['Revise os campos obrigatorios antes de salvar.'] : [],
    };
  }, [draft, fields, intent]);
  const preview = editedDraft ? buildCapturePreview(editedDraft) : null;

  const updateField = (key: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const updatePaymentTarget = (value: string) => {
    const target = captureContext.paymentTargets?.find(
      (item) => `${item.type}:${item.id}` === value
    );
    setFields((prev) => ({
      ...prev,
      paymentTarget: target?.id || '',
      paymentTargetType: target?.type || '',
    }));
  };

  const closeAsCancelled = useCallback(() => {
    if (editedDraft) recordCaptureMetric('cancelled', editedDraft.intent);
    onClose();
  }, [editedDraft, onClose]);

  useEffect(() => {
    if (!draft) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAsCancelled();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAsCancelled, draft]);

  const save = async (afterSave: (draft: CaptureDraft) => void) => {
    if (!editedDraft) return;

    const result = await executeCaptureDraft(
      editedDraft,
      { currentMonthKey: captureContext.currentMonthKey, cards: captureContext.cards },
      executorActions
    );

    if (!result.executed) {
      setError(result.reason || 'Nao foi possivel salvar.');
      return;
    }

    rememberCaptureDraft(editedDraft);
    recordCaptureMetric('saved', editedDraft.intent);
    afterSave(editedDraft);
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('.quick-capture-field input')?.focus();
    }, 0);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await save(onSaved);
  };

  return (
    <ModalShell open={Boolean(draft)} title="Revisar captura" onClose={closeAsCancelled}>
      <form className="modal-form capture-review-form" onSubmit={submit}>
        {preview ? (
          <div className="capture-review-preview">
            <strong>{preview.title}</strong>
            <span>{preview.summary}</span>
          </div>
        ) : null}

        <div className="form-grid">
          <label className="field">
            <span>Destino</span>
            <select
              value={intent}
              onChange={(event) => setIntent(event.target.value as CaptureIntent)}
            >
              {INTENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Descricao</span>
            <input
              value={String(fields.description || '')}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
        </div>

        <div className="form-grid tri">
          <label className="field">
            <span>Valor</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={String(fields.amount || '')}
              onChange={(event) => updateField('amount', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Dia</span>
            <input
              type="number"
              min="1"
              max="31"
              value={String(fields.day || '')}
              onChange={(event) => updateField('day', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Parcelas</span>
            <input
              type="number"
              min="1"
              value={String(fields.totalInstallments || '')}
              onChange={(event) => updateField('totalInstallments', event.target.value)}
            />
          </label>
        </div>

        <div className="form-grid tri">
          <label className="field">
            <span>Categoria</span>
            <select
              value={String(fields.category || 'outro')}
              onChange={(event) => updateField('category', event.target.value)}
            >
              {Object.entries(captureContext.categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pagamento</span>
            <select
              value={String(fields.paymentMethod || 'pix')}
              onChange={(event) => updateField('paymentMethod', event.target.value)}
            >
              {captureContext.paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Cartao</span>
            <select
              value={String(fields.card || '')}
              onChange={(event) => updateField('card', event.target.value)}
            >
              <option value="">Selecionar</option>
              {captureContext.cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Alvo pago</span>
            <select
              value={
                fields.paymentTarget && fields.paymentTargetType
                  ? `${fields.paymentTargetType}:${fields.paymentTarget}`
                  : ''
              }
              onChange={(event) => updatePaymentTarget(event.target.value)}
            >
              <option value="">Selecionar</option>
              {(captureContext.paymentTargets || []).map((target) => (
                <option key={`${target.type}:${target.id}`} value={`${target.type}:${target.id}`}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field capture-review-checkbox">
          <input
            type="checkbox"
            checked={fields.recurring === true}
            onChange={(event) => updateField('recurring', event.target.checked)}
          />
          <span>Recorrente</span>
        </label>

        {editedDraft?.missingFields.length ? (
          <p className="capture-review-error">
            Campos obrigatorios: {editedDraft.missingFields.join(', ')}
          </p>
        ) : null}
        {error ? <p className="capture-review-error">{error}</p> : null}

        <div className="factions">
          <button className="btn-save" type="submit">
            Salvar
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => void save(onSavedAndAddAnother)}
          >
            Salvar e adicionar outro
          </button>
          <button className="btn-cancel" type="button" onClick={closeAsCancelled}>
            Cancelar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
