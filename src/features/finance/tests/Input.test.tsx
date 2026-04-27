import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '../components/inputs/Input';

describe('Input.tsx', () => {
  it('renders with label', () => {
    render(<Input label="Nome" value="" onChange={() => {}} />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input label="Nome" value="" onChange={() => {}} placeholder="Digite aqui" />);
    expect(screen.getByPlaceholderText('Digite aqui')).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Input label="Nome" value="Test Value" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Test Value');
  });

  it('calls onChange when typed', () => {
    const handleChange = vi.fn();
    render(<Input label="Nome" value="" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with different types', () => {
    const { rerender } = render(
      <Input label="Number" type="number" value={0} onChange={() => {}} />
    );
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();

    rerender(<Input label="Password" type="password" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});
