import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Alert from '../components/Alert.jsx';
import { api } from '../lib/api.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = request code, 2 = enter code + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.forgotPassword(email);
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfo('');
    try {
      const data = await api.forgotPassword(email);
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword({ email, code, newPassword });
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <AuthLayout
        title="Forgot your password?"
        subtitle="Enter your account email and we'll send a 6-digit code to it."
        footer={
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Back to login
          </Link>
        }
      >
        <Alert>{error}</Alert>
        <form onSubmit={handleRequestCode}>
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition"
          >
            {submitting ? 'Sending code…' : 'Send reset code'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Enter your code"
      subtitle={`We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
      footer={
        <Link to="/login" className="text-brand-600 font-medium hover:underline">
          Back to login
        </Link>
      }
    >
      <Alert>{error}</Alert>
      <Alert type="success">{info}</Alert>
      <form onSubmit={handleReset}>
        <FormField
          id="code"
          label="6-digit code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="tracking-[0.3em] text-center"
          required
        />
        <FormField
          id="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <FormField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm py-2.5 transition"
        >
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>

        <button
          type="button"
          onClick={handleResendCode}
          className="w-full text-center text-sm text-ink-secondary hover:text-brand-600 mt-3 transition"
        >
          Didn&rsquo;t get it? Resend code
        </button>
      </form>
    </AuthLayout>
  );
}
