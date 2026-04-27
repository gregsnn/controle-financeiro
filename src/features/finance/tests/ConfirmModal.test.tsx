import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../components/modals/ConfirmModal';

describe('ConfirmModal.tsx', () => {
  it('renders nothing when not open', () => {
    render(
      <ConfirmModal
        open={false}
        title="Title"
        message="Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <ConfirmModal
        open={true}
        title="Confirmar"
        message="Tem certeza?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument();
  });

  it('renders custom confirm and cancel labels', () => {
    render(
      <ConfirmModal
        open={true}
        title="Title"
        message="Message"
        onConfirm={() => {}}
        onCancel={() => {}}
        confirmLabel="Sim"
        cancelLabel="Não"
      />
    );
    expect(screen.getByText('Sim')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Title"
        message="Message"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('Confirmar'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Title"
        message="Message"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('uses default labels', () => {
    render(
      <ConfirmModal
        open={true}
        title="Title"
        message="Message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });
});
