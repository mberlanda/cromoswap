import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandBar } from '../src/ui/CommandBar';

const GROUPS = ['FWC', 'A', 'B', 'C'] as const;

describe('CommandBar – filter', () => {
  test('renders filter icon button', () => {
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  test('filter panel hidden by default', () => {
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'FWC' })).not.toBeInTheDocument();
  });

  test('clicking filter icon shows group chips', async () => {
    const user = userEvent.setup();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: 'FWC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Group A' })).toBeInTheDocument();
  });

  test('active group chip has aria-pressed=true', async () => {
    const user = userEvent.setup();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set(['A'])}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: 'Group A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Group B' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking group chip calls onToggleGroup', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={spy}
        onClearFilter={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.click(screen.getByRole('button', { name: 'Group A' }));
    expect(spy).toHaveBeenCalledWith('A');
  });

  test('clicking FWC chip calls onToggleGroup with FWC', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={spy}
        onClearFilter={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.click(screen.getByRole('button', { name: 'FWC' }));
    expect(spy).toHaveBeenCalledWith('FWC');
  });

  test('reset chip visible when filters active, calls onClearFilter', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set(['A'])}
        onToggleGroup={() => {}}
        onClearFilter={spy}
      />,
    );
    await user.click(screen.getByRole('button', { name: /filter/i }));
    const reset = screen.getByRole('button', { name: /reset/i });
    await user.click(reset);
    expect(spy).toHaveBeenCalled();
  });

  test('active filter count badge shown on filter button when filters active', () => {
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set(['A', 'B'])}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('CommandBar – search', () => {
  test('renders search button when onSearchChange provided', () => {
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /search teams/i })).toBeInTheDocument();
  });

  test('search button has aria-expanded=false by default', () => {
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /search teams/i })).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking search button reveals input and aria-expanded becomes true', async () => {
    const user = userEvent.setup();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
        onSearchChange={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /search teams/i });
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('searchbox', { name: /search teams/i })).toBeInTheDocument();
  });

  test('typing into search input calls onSearchChange', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <CommandBar
        groups={GROUPS}
        activeGroups={new Set()}
        onToggleGroup={() => {}}
        onClearFilter={() => {}}
        searchQuery=""
        onSearchChange={spy}
      />,
    );
    await user.click(screen.getByRole('button', { name: /search teams/i }));
    await user.type(screen.getByRole('searchbox', { name: /search teams/i }), 'bra');
    // controlled input: value stays '' so each keystroke emits a single char
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['b', 'r', 'a']);
  });
});
