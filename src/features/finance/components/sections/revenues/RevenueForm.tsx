import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { applyMoneyMask } from '../../../lib/moneyInput';
import { Input } from '../../inputs';

export type RevenueFormState = { name: string; amount: string; startMonth: string };

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
          placeholder="Salário, extra, bônus..."
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
      <Input
        label="Mês de início"
        type="month"
        value={form.startMonth}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setForm((prev) => ({ ...prev, startMonth: e.target.value }))
        }
        placeholder=""
      />
    </>
  );
}
