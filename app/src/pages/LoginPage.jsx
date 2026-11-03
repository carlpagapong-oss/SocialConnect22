import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field } from "@/components/common/Field";
import { PasswordField } from "@/components/common/PasswordField";
import { FormError } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { authService } from "@/services/authService";
import { inputCls, primaryButtonCls } from "@/utils/constants";

export default function LoginPage() {
  usePageTitle("Log in — Social Connect");
  const { startLogin, completeLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [pendingAuth, setPendingAuth] = useState(null);
  const [resetRequest, setResetRequest] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirmation: "" });
  const [view, setView] = useState("login");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [resendCooldownRemaining, setResendCooldownRemaining] = useState(0);
  const [showEmailReceipt, setShowEmailReceipt] = useState(false);
  const [copiedReceiptCode, setCopiedReceiptCode] = useState(false);

  const normalizeLoginChallenge = (response) => {
    const expiresAt = Number(response.expiresAt);
    return {
      ...response,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 120000,
    };
  };

  useEffect(() => {
    if (!successMessage) return undefined;

    setSuccessVisible(true);
    const fadeTimer = window.setTimeout(() => setSuccessVisible(false), 3500);
    const clearTimer = window.setTimeout(() => setSuccessMessage(""), 4000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [successMessage]);

  useEffect(() => {
    if (view !== "verification" || !pendingAuth?.response?.expiresAt) return undefined;

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((pendingAuth.response.expiresAt - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
      const cooldownRemaining = pendingAuth.response.cooldownUntil
        ? Math.max(0, Math.ceil((pendingAuth.response.cooldownUntil - Date.now()) / 1000))
        : 0;
      setResendCooldownRemaining(cooldownRemaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [pendingAuth, view]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await startLogin(form.identifier, form.password);
      setPendingAuth({
        type: "login",
        response: normalizeLoginChallenge(response),
      });
      setVerificationCode("");
      setView("verification");
    } catch (err) {
      const msg = err?.message || "";
      if (err?.status === 403 || /deactivat/i.test(msg)) {
        setError(
          "Your account has been deactivated by an administrator. Please contact the admin.",
        );
      } else if (err?.status === 401) {
        setError("Username or password is incorrect.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit authentication code.");
      return;
    }

    if (secondsRemaining <= 0) {
        setError("This authentication code has expired. Request a new one.");
        return;
    }

    if (pendingAuth.type === "login") {
      setSubmitting(true);
      try {
        const response = pendingAuth.response.token
          ? pendingAuth.response
          : await authService.verifyLoginCode(
              pendingAuth.response.challengeId,
              verificationCode,
            );
        const user = completeLogin(response);
        navigate(user.role === "admin" ? "/admin/accounts" : "/home");
      } catch (err) {
        if (err?.status === 410) setSecondsRemaining(0);
        setError(err?.message || "Unable to verify the authentication code.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setView("reset-password");
      setError("");
    }
  };

  const handleResendCode = async () => {
    if (!pendingAuth?.response?.expiresAt) return;

    setError("");
    setSubmitting(true);
    try {
      let response;
      if (pendingAuth.type === "login") {
        response = pendingAuth.response.challengeId
          ? await authService.resendLoginCode(pendingAuth.response.challengeId)
          : await startLogin(form.identifier, form.password);
      } else {
        try {
          response = await authService.resendPasswordResetCode(
            pendingAuth.response.challengeId,
          );
        } catch (err) {
          if (err?.status !== 404) throw err;
          response = await authService.requestPasswordReset(resetEmail);
        }
      }
      setPendingAuth({
        type: pendingAuth.type,
        response: normalizeLoginChallenge(response),
      });
      setVerificationCode("");
      setShowEmailReceipt(false);
      setCopiedReceiptCode(false);
    } catch (err) {
      if (err?.status === 429) {
        setResendCooldownRemaining(Math.max(0, Number(err.retryAfter) || 300));
      }
      setError(err?.message || "Unable to resend the authentication code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = verificationCode.padEnd(6, " ").split("");
    nextCode[index] = digit;
    setVerificationCode(nextCode.join("").replace(/ /g, ""));

    if (digit) {
      document.getElementById(`verification-code-${Math.min(index + 1, 5)}`)?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !verificationCode[index] && index > 0) {
      document.getElementById(`verification-code-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setVerificationCode(pastedCode);
    document.getElementById(`verification-code-${Math.min(pastedCode.length, 5)}`)?.focus();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await authService.requestPasswordReset(resetEmail);
      setResetRequest({ email: response.email });
      setPendingAuth({ type: "reset", response: normalizeLoginChallenge(response) });
      setVerificationCode("");
      setView("verification");
    } catch (err) {
      setError(err?.message || "Unable to start password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (resetForm.password !== resetForm.confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(resetRequest.email, resetForm.password);
      setForm((current) => ({ ...current, password: "" }));
      setResetForm({ password: "", confirmation: "" });
      setPendingAuth(null);
      setResetRequest(null);
      setResetEmail("");
      setView("login");
      setSuccessMessage("Your password has been updated. You can now log in.");
    } catch (err) {
      setError(err?.message || "Unable to update your password.");
    } finally {
      setSubmitting(false);
    }
  };

  const returnToLogin = () => {
    setPendingAuth(null);
    setResetRequest(null);
    setResetForm({ password: "", confirmation: "" });
    setVerificationCode("");
    setError("");
    setSuccessMessage("");
    setView("login");
    setShowEmailReceipt(false);
  };

  const copyReceiptCode = async () => {
    const code = pendingAuth?.response?.code;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedReceiptCode(true);
    window.setTimeout(() => setCopiedReceiptCode(false), 1800);
  };

  const useReceiptCode = () => {
    if (!pendingAuth?.response?.code) return;
    setVerificationCode(pendingAuth.response.code);
    setShowEmailReceipt(false);
  };

  return (
    <AuthLayout showSocialProof={false}>
      {view === "verification" ? (
        <div className="relative rounded-[22px] border border-border bg-card px-7 pb-7 pt-8 shadow-[0_12px_35px_-28px_rgba(100,70,180,0.45)] sm:px-8">
          <button type="button" onClick={() => setShowEmailReceipt(true)} className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-bold text-muted-foreground hover:bg-primary-soft">
            <Mail className="h-3.5 w-3.5" />
            View email
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-7 w-7" strokeWidth={1.8} />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              {pendingAuth?.type === "reset" ? "Step 2 of 3" : "One last step"}
            </p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.04em] text-foreground">Check your inbox</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit verification code to
              <br />
              <strong className="text-foreground">{pendingAuth?.response?.email}</strong>
            </p>
          </div>
          {pendingAuth?.response?.expiresAt && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Code expires in{" "}
              <span className="font-semibold text-foreground">
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
              </span>
            </p>
          )}
          <form className="mt-7 space-y-6" onSubmit={handleVerificationSubmit}>
            <FormError id="login-error" message={error} />
            <Field label={<span className="text-foreground">Social Connect verification code</span>}>
              <div className="flex justify-between gap-2" onPaste={handleCodePaste}>
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    id={`verification-code-${index}`}
                    required
                    autoFocus={index === 0}
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    aria-label={`Verification digit ${index + 1}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-13 w-11 rounded-xl border border-input bg-card text-center text-lg font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-12"
                    value={verificationCode[index] || ""}
                    onChange={(event) => handleCodeChange(index, event.target.value)}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  />
                ))}
              </div>
            </Field>
            <button disabled={submitting} type="submit" className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-button transition hover:opacity-90 disabled:opacity-60">
              {submitting ? "Verifying..." : "Verify email"}
            </button>
            {pendingAuth?.response?.expiresAt && (
              <p className="text-center text-xs text-muted-foreground">
                Didn&apos;t receive the email?{" "}
                <button
                  type="button"
                  disabled={submitting || resendCooldownRemaining > 0}
                  className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleResendCode}
                >
                  {resendCooldownRemaining > 0
                    ? `Resend available in ${Math.floor(resendCooldownRemaining / 60)}:${String(resendCooldownRemaining % 60).padStart(2, "0")}`
                    : "Resend code"}
                </button>
              </p>
            )}
            <button
              type="button"
              className="w-full border-t border-border pt-5 text-sm text-muted-foreground hover:text-primary"
              onClick={returnToLogin}
            >
              ← &nbsp;Back to sign in
            </button>
          </form>
          {showEmailReceipt && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-background px-3 py-5 text-foreground sm:px-5 sm:py-8">
              <div className="mx-auto max-w-2xl">
                <button type="button" onClick={() => setShowEmailReceipt(false)} className="mb-5 text-sm text-[#617066]">← Back to verification</button>
                <div className="flex items-end justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary">Received email</p>
                    <h1 className="mt-2 text-lg font-semibold">Your Social Connect verification code</h1>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Just now</span>
                </div>
                <div className="flex items-center gap-2 border-b border-border py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">S</div>
                  <div><p className="text-xs font-bold">Social Connect</p><p className="text-[9px] text-muted-foreground">hello@socialconnect.com</p></div>
                  <span className="ml-auto text-[9px] text-muted-foreground">to {pendingAuth?.response?.email}</span>
                </div>
                <div className="mt-5 rounded-xl border border-[#dfe8df] bg-white p-7">
                  <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">S</div><span className="text-sm font-bold">Social Connect</span></div>
                  <h2 className="mt-7 text-sm font-bold">Hi there,</h2>
                  <p className="mt-2 text-[11px] text-muted-foreground">Use the Social Connect verification code below to finish setting up your account.</p>
                  <button type="button" onClick={copyReceiptCode} disabled={!pendingAuth?.response?.code} className="mt-5 flex w-full items-center justify-between rounded-lg border border-dashed border-primary/50 bg-primary-soft px-4 py-4 text-left disabled:opacity-70">
                    <span className="text-xl font-bold tracking-[0.28em] text-primary">{pendingAuth?.response?.code || "------"}</span>
                    <span className="text-[9px] font-bold uppercase text-primary">{copiedReceiptCode ? "Copied" : "Click to copy"}</span>
                  </button>
                  <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">This code expires in <strong>2 minutes</strong>. If you didn&apos;t request this code, you can safely ignore this email.</p>
                  <button type="button" onClick={useReceiptCode} disabled={!pendingAuth?.response?.code} className="mt-5 h-10 w-full rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50">USE CODE</button>
                  <div className="mt-5 border-t border-border pt-3 text-[9px] text-muted-foreground">Sent securely by Social Connect · Please do not reply to this email.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : view === "reset-password" ? (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-7 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step 3 of 3
          </p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight">Create new password</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            Your email has been verified. Create a new password for your account.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleResetSubmit}>
            <FormError id="login-error" message={error} />
            <Field label="New password">
              <PasswordField
                placeholder="At least 8 characters"
                value={resetForm.password}
                onChange={(e) => setResetForm((current) => ({ ...current, password: e.target.value }))}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>
            <Field label="Re-enter new password">
              <PasswordField
                placeholder="Re-enter your new password"
                value={resetForm.confirmation}
                onChange={(e) =>
                  setResetForm((current) => ({ ...current, confirmation: e.target.value }))
                }
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>
            <button disabled={submitting} className={primaryButtonCls}>
              {submitting ? "Updating password..." : "Update password"}
            </button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={returnToLogin}>
              Back to login
            </button>
          </form>
        </>
      ) : view === "forgot" ? (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-7 text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step 1 of 3
          </p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight">Forgot password?</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            Don&apos;t worry! Enter your registered email address and we&apos;ll help you recover your account.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleForgotSubmit}>
            <FormError id="login-error" message={error} />
            <Field label="Email address">
              <input
                required
                autoFocus
                type="email"
                className={inputCls}
                placeholder="Enter your email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
              />
            </Field>
            <button disabled={submitting} className={primaryButtonCls}>
              {submitting ? "Sending code..." : "Send code"}
            </button>
            <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={returnToLogin}>
              Back to login
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase text-primary">Welcome back</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Good to see you again</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your details to get back to your circle.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handlePasswordSubmit}>
            <FormError id="login-error" message={error} />
            {successMessage && (
              <p
                role="status"
                className={`rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-700 transition-opacity duration-500 ${
                  successVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {successMessage}
              </p>
            )}
            <Field label="Username">
              <input
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className={inputCls}
                placeholder="Username or email"
                value={form.identifier}
                onChange={set("identifier")}
              />
            </Field>
            <Field label="Password">
              <PasswordField
                placeholder="At least 8 characters"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                value={form.password}
                onChange={set("password")}
              />
            </Field>
            <button disabled={submitting} className={primaryButtonCls}>
              {submitting ? "Logging in..." : "Log in to Social Connect"}
            </button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-sm font-medium text-primary hover:underline"
            onClick={() => {
              setError("");
              setView("forgot");
            }}
          >
            Forgot password?
          </button>
        </>
      )}
      {view === "login" && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New around here?{" "}
          <Link to="/signup" className="text-primary">
            Create an account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
