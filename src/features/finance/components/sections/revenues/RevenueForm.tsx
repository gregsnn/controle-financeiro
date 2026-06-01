import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { applyMoneyMask } from '../../../lib/moneyInput';
import { Input } from '../../inputs';

export type RevenueFormState = {
  name: string;
  amount: string;
  startMonth: string;
  paymentDay: string;
  recurring: boolean;
};

interface RevenueFormProps {
  form: RevenueFormState;
  setForm: Dispatch<SetStateAction<RevenueFormState>>;
}

export function RevenueForm({ form, setForm }: RevenueFormProps) {
  return (
    <>
      <div className="form-grid">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Salario, extra, bonus..."
        />
        <Input
          label="Valor"
          type="text"
          value={form.amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, amount: applyMoneyMask(e.target.value) }))
          }
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
        />
      </div>
      <div className="form-grid">
        <Input
          label="Dia de recebimento"
          type="number"
          min="1"
          max="31"
          value={form.paymentDay}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, paymentDay: e.target.value }))
          }
          placeholder="Ex.: 5"
        />
        <label className="field checkbox-field">
          <span>Recorrente</span>
          <select
            value={form.recurring ? 'sim' : 'nao'}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, recurring: e.target.value === 'sim' }))
            }
          >
            <option value="sim">Sim</option>
            <option value="nao">Nao, apenas este mes</option>
          </select>
        </label>
      </div>
    </>
  );
}
