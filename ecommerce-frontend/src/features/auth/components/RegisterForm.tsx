import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, isLoading, error, clearError } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 2 OTP Data
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Password strength logic
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSym = /[^A-Za-z0-9]/.test(password);

  const getStrengthScore = () => {
    let score = 0;
    if (hasMinLen) score++;
    if (hasUpper) score++;
    if (hasNum) score++;
    if (hasSym) score++;
    return score;
  };

  const score = getStrengthScore();

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreeTerms) {
      setValidationError('Please accept the Terms of Service to continue.');
      return;
    }

    // Format phone to ensure +855 or 0 prefix
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+855') && !formattedPhone.startsWith('0')) {
      formattedPhone = `+855${formattedPhone.replace(/^0+/, '')}`;
    }

    try {
      await register({
        firstName,
        lastName,
        email,
        phone: formattedPhone,
        password,
      });
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      // Handled by AuthContext error
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      const lastInput = document.getElementById('otp-input-5');
      lastInput?.focus();
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setValidationError('Please enter all 6 digits of the OTP code.');
      return;
    }

    try {
      await verifyOtp({ email, otpCode });
      navigate('/');
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setValidationError(null);
    clearError();

    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+855') && !formattedPhone.startsWith('0')) {
        formattedPhone = `+855${formattedPhone.replace(/^0+/, '')}`;
      }

      await register({
        firstName,
        lastName,
        email,
        phone: formattedPhone,
        password,
      });

      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err) {
      // Error handled
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 border border-white/10 backdrop-blur-xl relative">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm uppercase tracking-wide">
            {step === 1
              ? 'Step 1 of 2: Personal & Account Information'
              : 'Step 2 of 2: OTP Verification & Activation'}
          </span>
          <div className="flex items-center gap-1.5 text-tertiary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>Encrypted Session</span>
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1">
          {step === 1 ? 'Create Your Account' : 'Enter Verification Code'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {step === 1
            ? 'Enter your profile credentials. You will verify your secure OTP in Step 2.'
            : `We've sent a 6-digit verification code to ${email}. Please enter it to finalize your registration.`}
        </p>
      </div>

      {/* Global Error Banner */}
      {(error || validationError) && (
        <div className="p-3 rounded-xl bg-error-container/80 text-on-error-container text-body-sm font-body-sm flex items-center justify-between border border-error/30 animate-fade-in">
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
            className="hover:opacity-80 text-on-error-container cursor-pointer p-1"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {step === 1 ? (
        /* STEP 1: REGISTRATION FORM */
        <form className="flex flex-col gap-4" onSubmit={handleStep1Submit}>
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center gap-1"
                htmlFor="firstName"
              >
                First Name <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  badge
                </span>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Serey"
                  className="w-full h-12 pl-11 pr-3 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center gap-1"
                htmlFor="lastName"
              >
                Last Name <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  person
                </span>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Vathanak"
                  className="w-full h-12 pl-11 pr-3 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-label-md text-label-md text-on-surface flex items-center gap-1"
              htmlFor="reg-email"
            >
              Email Address <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                mail
              </span>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="serey.vathanak@example.com.kh"
                className="w-full h-12 pl-11 pr-3 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Cambodian Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-label-md text-label-md text-on-surface flex items-center gap-1"
              htmlFor="phone"
            >
              Cambodian Phone Number <span className="text-error">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 pr-2 border-r border-white/10">
                <span className="text-[14px]">🇰🇭</span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  +855
                </span>
              </div>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="12 345 678"
                className="w-full h-12 pl-24 pr-3 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
              />
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Format: Smart, Cellcard, Metfone (e.g. 12 345 678 or 012345678)
            </span>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center gap-1"
                htmlFor="password"
              >
                Password <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  key
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
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

            <div className="flex flex-col gap-1.5">
              <label
                className="font-label-md text-label-md text-on-surface flex items-center gap-1"
                htmlFor="confirmPassword"
              >
                Confirm Password <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px]">
                  lock_reset
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md border border-white/5 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-4 gap-2 mt-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  score >= 1 ? (score === 1 ? 'bg-error' : 'bg-tertiary') : 'bg-surface-container-highest'
                }`}
              ></div>
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  score >= 2 ? (score === 2 ? 'bg-secondary' : 'bg-tertiary') : 'bg-surface-container-highest'
                }`}
              ></div>
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  score >= 3 ? 'bg-tertiary' : 'bg-surface-container-highest'
                }`}
              ></div>
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  score >= 4 ? 'bg-tertiary' : 'bg-surface-container-highest'
                }`}
              ></div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  hasMinLen ? 'bg-tertiary-container/40 text-tertiary font-semibold' : 'bg-surface-container text-on-surface-variant/60'
                }`}
              >
                ✓ 8+ chars
              </span>
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  hasUpper ? 'bg-tertiary-container/40 text-tertiary font-semibold' : 'bg-surface-container text-on-surface-variant/60'
                }`}
              >
                ✓ Uppercase
              </span>
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  hasNum ? 'bg-tertiary-container/40 text-tertiary font-semibold' : 'bg-surface-container text-on-surface-variant/60'
                }`}
              >
                ✓ Number
              </span>
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  hasSym ? 'bg-tertiary-container/40 text-tertiary font-semibold' : 'bg-surface-container text-on-surface-variant/60'
                }`}
              >
                ✓ Symbol
              </span>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container border border-white/5 mt-1">
            <input
              id="termsCheck"
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5 accent-primary cursor-pointer"
            />
            <label
              htmlFor="termsCheck"
              className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer select-none leading-relaxed"
            >
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline font-semibold">
                Terms of Service
              </Link>
              , Privacy Charter, and the protections outlined in the{' '}
              <span className="text-secondary font-semibold">
                Cambodian Digital Commerce Law (2019)
              </span>
              .
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-container via-primary to-secondary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(128,131,255,0.35)] hover:shadow-[0_0_32px_rgba(76,215,246,0.5)] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Initiating OTP...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                  <span>Register &amp; Send OTP</span>
                </>
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="flex items-center justify-center gap-2 pt-2 font-body-md text-body-md text-on-surface-variant">
            <span>Already have an account?</span>
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      ) : (
        /* STEP 2: OTP VERIFICATION FORM */
        <form className="flex flex-col gap-6" onSubmit={handleStep2Submit}>
          {/* Dispatched Info Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container border border-white/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
              <span className="font-label-md text-label-md text-on-surface font-mono">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-on-surface-variant hover:text-primary transition-colors text-body-sm font-medium underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>

          {/* 6-Digit OTP Boxes */}
          <div className="flex flex-col gap-2">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center justify-between">
              <span>Security Token Code</span>
              <span className="text-secondary font-label-sm text-label-sm uppercase">
                (Numeric 6-Digit)
              </span>
            </label>

            <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
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

            <p className="text-body-sm font-body-sm text-on-surface-variant text-center">
              Type or paste the 6-digit code sent to your email inbox.
            </p>
          </div>

          {/* Resend Timer Row */}
          <div className="p-4 rounded-xl bg-surface-container border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[22px]">timer</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant/70">
                  Resend Countdown
                </span>
                <span className="font-headline-sm text-headline-sm font-mono text-on-surface font-bold">
                  0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canResend || isLoading}
              onClick={handleResendCode}
              className={`px-4 py-2 rounded-xl text-label-md font-label-md font-semibold transition-all cursor-pointer ${
                canResend
                  ? 'bg-secondary text-on-secondary hover:bg-secondary-container'
                  : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
              }`}
            >
              Resend OTP Code
            </button>
          </div>

          {/* Confirm Action Button */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-secondary-container via-primary-container to-secondary text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(76,215,246,0.35)] hover:shadow-[0_0_32px_rgba(128,131,255,0.5)] transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                  <span>Verify OTP &amp; Activate Account</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2 text-center text-on-surface-variant hover:text-on-surface text-body-sm font-medium transition-colors cursor-pointer"
            >
              ← Back to Registration Details
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
