import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    if (!email) return;

    try {
      const res = await forgotPassword({ email });
      setSuccessMessage(res.message || 'Verification code has been sent to your email.');
      setStep(2);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      // Handled by AuthContext
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      const lastInput = document.getElementById('forgot-otp-input-5');
      lastInput?.focus();
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);
    clearError();

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setValidationError('Please enter all 6 digits of your reset passcode.');
      return;
    }

    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);
    const hasSym = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNum || !hasSym) {
      setValidationError('Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
      return;
    }

    try {
      const res = await resetPassword({ email, otpCode: code, newPassword });
      setSuccessMessage(res.message || 'Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Handled by AuthContext
    }
  };


  return (
    <div className="relative bg-surface-container/90 backdrop-blur-2xl rounded-2xl shadow-xl p-6 md:p-8 flex flex-col gap-6 border border-white/10">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-md bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold uppercase tracking-wider">
            Step {step} of 2
          </span>
          <span className="font-label-md text-label-md text-on-surface font-semibold">
            {step === 1 ? 'Identify Account' : 'Verify OTP & Set New Password'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span className="text-outline">{step === 1 ? 'Step 2 Locked' : 'Step 2 Active'}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
        <div
          className={`bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 ${
            step === 1 ? 'w-1/2' : 'w-full'
          }`}
        ></div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
          {step === 1 ? 'Forgot Your Password?' : 'Enter 6-Digit Passcode & New Password'}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {step === 1
            ? 'Enter your registered email address below. We will send you a 6-digit email OTP verification code to safely reset your passphrase.'
            : `Enter the 6-digit verification code sent to ${email} along with your new password.`}
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-tertiary-container/20 border border-tertiary/40 text-tertiary text-body-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {(error || validationError) && (
        <div className="p-3.5 rounded-xl bg-error-container/80 border border-error/30 text-on-error-container text-body-sm font-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{validationError || error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              clearError();
            }}
            className="hover:opacity-80 text-on-error-container p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {step === 1 ? (
        /* STEP 1: ENTER EMAIL */
        <form className="flex flex-col gap-5" onSubmit={handleStep1Submit}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-on-surface" htmlFor="recovery-email">
                Email Address <span className="text-error">*</span>
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                Registered Mailbox
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <input
                id="recovery-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sokha.chan@example.com"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-low transition-all border border-white/5 focus:border-primary/40"
              />
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant/70">
              Must match your verified primary account email.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary-container/10 border border-secondary/20 flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5 text-[20px]">
              mark_email_unread
            </span>
            <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
              <strong className="text-secondary font-medium">Security Notice:</strong> Verification codes are sent via encrypted TLS email dispatch and expire in 5 minutes.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(99,102,241,0.40)] hover:bg-primary-container transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Sending Code...</span>
              </div>
            ) : (
              <>
                <span>Send Reset Code &amp; Continue</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* STEP 2: ENTER OTP & NEW PASSWORD */
        <form className="flex flex-col gap-5" onSubmit={handleStep2Submit}>
          {/* 6 Discrete OTP Input Boxes */}
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center justify-between">
              <span>Security Passcode (OTP)</span>
              <span className="text-secondary font-label-sm text-label-sm uppercase">
                (Numeric 6-Digit)
              </span>
            </label>

            <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full my-1">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`forgot-otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  className={`h-14 sm:h-16 rounded-xl text-center font-headline-lg text-headline-lg font-bold text-on-surface transition-all border outline-none ${
                    digit
                      ? 'bg-surface-container-high border-secondary/50 shadow-[0_0_16px_rgba(76,215,246,0.3)]'
                      : 'bg-surface-container-lowest border-white/10 focus:border-primary/50'
                  }`}
                />
              ))}
            </div>

            <p className="text-body-sm font-body-sm text-on-surface-variant/70 text-center">
              Type or paste the 6-digit code sent to your email inbox.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="new-password">
              New Passphrase <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                key
              </span>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters with numbers &amp; symbols"
                className="w-full h-12 pl-11 pr-12 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl focus:outline-none focus:bg-surface-container-low transition-all border border-white/5 focus:border-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-tertiary text-on-tertiary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(78,222,163,0.35)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"></span>
                <span>Resetting Passphrase...</span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                <span>Confirm New Passphrase &amp; Unlock</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="py-1 text-center text-on-surface-variant hover:text-on-surface text-body-sm font-medium transition-colors cursor-pointer"
          >
            ← Change Email Address
          </button>
        </form>
      )}

      {/* Navigation Footer Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/5">
        <Link
          to="/login"
          className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Remembered your password? Sign In</span>
        </Link>
        <Link
          to="/register"
          className="font-label-md text-label-md text-secondary hover:text-secondary-fixed transition-colors font-semibold"
        >
          Create an Account →
        </Link>
      </div>
    </div>
  );
};
