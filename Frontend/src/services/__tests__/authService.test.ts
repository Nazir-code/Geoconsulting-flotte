// services/__tests__/authService.test.ts
// Tests unitaires pour le service d'authentification Firebase

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../authService';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
  browserSessionPersistence: {},
}));

vi.mock('@/lib/firebaseConfig', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleAuthError', () => {
    it('should return correct French error messages for Firebase Auth errors', () => {
      const testCases = [
        {
          code: 'auth/user-not-found',
          expected: 'Aucun compte trouvé avec cet email',
        },
        {
          code: 'auth/wrong-password',
          expected: 'Mot de passe incorrect',
        },
        {
          code: 'auth/invalid-email',
          expected: 'Format d\'email invalide',
        },
        {
          code: 'auth/email-already-in-use',
          expected: 'Un compte existe déjà avec cet email',
        },
        {
          code: 'auth/weak-password',
          expected: 'Le mot de passe doit contenir au moins 6 caractères',
        },
        {
          code: 'auth/network-request-failed',
          expected: 'Erreur de connexion. Vérifiez votre réseau',
        },
        {
          code: 'auth/too-many-requests',
          expected: 'Trop de tentatives. Réessayez plus tard',
        },
        {
          code: 'auth/user-disabled',
          expected: 'Ce compte a été désactivé',
        },
        {
          code: 'auth/invalid-credential',
          expected: 'Identifiants invalides',
        },
      ];

      testCases.forEach(({ code, expected }) => {
        const error = { code, message: 'Firebase error' } as any;
        const result = (AuthService as any).handleAuthError(error);
        expect(result).toBe(expected);
      });
    });

    it('should return generic error message for unknown error codes', () => {
      const error = { code: 'auth/unknown-error', message: 'Unknown error' } as any;
      const result = (AuthService as any).handleAuthError(error);
      expect(result).toBe('Erreur d\'authentification: Unknown error');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        'user name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate password with minimum requirements', () => {
      const result = AuthService.validatePassword('123456');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0); // Should have recommendations
    });

    it('should reject passwords that are too short', () => {
      const result = AuthService.validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 6 caractères');
    });

    it('should provide recommendations for stronger passwords', () => {
      const result = AuthService.validatePassword('password');
      expect(result.isValid).toBe(true);
      expect(result.errors).toContain('Recommandé: au moins une majuscule');
      expect(result.errors).toContain('Recommandé: au moins un chiffre');
      expect(result.errors).toContain('Recommandé: au moins un caractère spécial');
    });

    it('should validate strong passwords with minimal errors', () => {
      const result = AuthService.validatePassword('MyStr0ng!Pass');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBeLessThan(2); // Should have few or no recommendations
    });

    it('should handle empty password', () => {
      const result = AuthService.validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 6 caractères');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is logged in', () => {
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      expect(AuthService.getCurrentUser()).toBe(null);
    });
  });

  describe('clearLocalStorage', () => {
    it('should remove authentication data from localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });

      AuthService.clearLocalStorage();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fleetnexus_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('fleetnexus_token');
    });
  });
});