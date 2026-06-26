import { screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '~/test/render';
import LoginPage from './page';

describe('LoginPage', () => {
  it('renders the sign-in form', () => {
    renderWithProviders(<LoginPage params={{}} searchParams={{}} />, {
      route: '/login',
    });
    expect(
      screen.getByRole('heading', { name: /sign in to bookmarkvault/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderWithProviders(
      <LoginPage params={{}} searchParams={{}} />,
      { route: '/login' },
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
