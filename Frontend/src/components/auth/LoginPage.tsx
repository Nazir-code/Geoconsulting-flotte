import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext_Firebase';
import { AuthService } from '@/services/authService';
import logoGeoconsulting from '@/assets/logo_geoconsulting.png';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: true, errors: [] });

  // Validation du mot de passe en temps réel
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp && value) {
      const validation = AuthService.validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validation côté client
        if (!AuthService.validateEmail(email)) {
          throw new Error('Format d\'email invalide');
        }

        if (!passwordValidation.isValid) {
          throw new Error('Le mot de passe ne respecte pas les critères requis');
        }

        if (!name.trim()) {
          throw new Error('Le nom est requis');
        }

        await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          role: 'manager', // Par défaut manager pour le web dashboard
        });

        setSuccess('Compte créé avec succès ! Vous êtes maintenant connecté.');
        onLogin();
      } else {
        await signIn({
          email: email.trim(),
          password,
          rememberMe,
        });
        onLogin();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez saisir votre email pour réinitialiser le mot de passe');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await AuthService.resetPassword(email);
      setSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-violet/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm p-4 mx-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-6"
        >
          <img
            src={logoGeoconsulting}
            alt="Geoconsulting"
            className="inline-block w-14 h-14 rounded-2xl object-contain mb-3"
          />
          <h1 className="text-2xl font-display font-bold text-text-primary mb-1">
            Géo<span className="text-accent-cyan">Consulting.ne</span>
          </h1>
          <p className="text-sm text-text-secondary">
            {isSignUp ? 'Créer un compte manager' : 'Connectez-vous à votre compte'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="glass-card p-6 space-y-4"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Name Field (Sign Up only) */}
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                <UserPlus className="w-4 h-4" />
                Nom complet
              </label>
              <div className="form-input-container">
                <UserPlus className="w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="input-field"
                  required
                />
              </div>
            </div>
          )}

          {/* Phone Field (Sign Up only) */}
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                <Mail className="w-4 h-4" />
                Téléphone
              </label>
              <div className="form-input-container">
                <Mail className="w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+227 90 12 34 56"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <div className="form-input-container">
              <Mail className="w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">
              <Lock className="w-4 h-4" />
              Mot de passe
            </label>
            <div className="form-input-container">
              <Lock className="w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-icon"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Validation (Sign Up only) */}
            {isSignUp && password && !passwordValidation.isValid && (
              <div className="mt-2 space-y-1">
                {passwordValidation.errors.map((error, index) => (
                  <p key={index} className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Remember Me (Sign In only) */}
          {!isSignUp && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                <p className="mb-1">🔒 Sécurité de la session:</p>
                <p className="text-xs text-text-secondary/80">
                  Votre session expirera après 30 min d'inactivité ou à la fermeture du navigateur
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || (isSignUp && !passwordValidation.isValid)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-5 h-5" />
                <span>{isSignUp ? 'Création...' : 'Connexion...'}</span>
              </>
            ) : (
              <span>{isSignUp ? 'Créer le compte' : 'Se connecter'}</span>
            )}
          </motion.button>

          {/* Toggle Sign Up/Sign In */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-text-secondary">
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setPassword('');
                  setPasswordValidation({ isValid: true, errors: [] });
                }}
                className="ml-2 text-accent-cyan hover:text-accent-cyan/80 transition-colors font-medium"
              >
                {isSignUp ? 'Se connecter' : 'Créer un compte'}
              </button>
            </p>
          </div>

          {/* Demo Credentials (Sign In only) */}
          {!isSignUp && (
            <div className="pt-4 border-t border-border">
             
            </div>
          )}
        </motion.form>
      </motion.div>

      {/* Grain & Vignette */}
      <div className="grain-overlay" />
      <div className="vignette" />
    </div>
  );
}
