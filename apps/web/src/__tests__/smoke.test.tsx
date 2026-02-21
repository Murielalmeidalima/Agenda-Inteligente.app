import { render, screen } from '@testing-library/react'
import { expect, test, vi, beforeAll } from 'vitest'
import LoginPage from '../app/auth/login/page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Mock Supabase
vi.mock('@/lib/supabase-browser', () => ({
  createBrowserClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
    },
  }),
}))

// Mock UI Components to avoid deep rendering issues or missing context
vi.mock('@projeto/ui', () => ({
  Button: ({ children, loading, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Badge: ({ children }: any) => <span>{children}</span>,
  Toaster: () => null,
}))

// Mock Local Components
vi.mock('@/components/ui/Logo', () => ({
  LogoImage: () => <div data-testid="logo-mock">Logo</div>,
}))

vi.mock('@/components/auth/AnimatedBackground', () => ({
  AnimatedBackground: ({ children }: any) => <div>{children}</div>,
}))

test('Smoke Test: LoginPage renders correctly', () => {
    render(<LoginPage />)
    
    // Check for main elements
    expect(screen.getByRole('button', { name: /entrar na plataforma/i })).toBeDefined()
    expect(screen.getByPlaceholderText(/voce@clinica.com/i)).toBeDefined()
    expect(screen.getByText(/bem-vindo de volta/i)).toBeDefined()
})
