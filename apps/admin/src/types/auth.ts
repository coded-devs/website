import type { AdminUser } from '@codeddevs/auth-contract';
export type {
  AdminUser,
  LoginCredentials,
  LoginResponse,
  CurrentSessionResponse,
} from '@codeddevs/auth-contract';

export type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: AdminUser; error: string | null }
  | { status: 'unauthenticated'; user: null; error: string | null };
