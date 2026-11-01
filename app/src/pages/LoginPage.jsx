import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field } from "@/components/common/Field";
import { PasswordField } from "@/components/common/PasswordField";
import { FormError } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { inputCls, primaryButtonCls } from "@/utils/constants";

export default function LoginPage() {
  usePageTitle("Log in — Social Connect");
  const { startLogin, completeLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [pendingAuth, setPendingAuth] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      setPendingAuth(await startLogin(form.identifier, form.password));
      setVerificationCode("");
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

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit authentication code.");
      return;
    }

    const user = completeLogin(pendingAuth);
    navigate(user.role === "admin" ? "/admin/accounts" : "/home");
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = verificationCode.padEnd(6, " ").split("");
    nextCode[index] = digit;
    setVerificationCode(nextCode.join("").replace(/ /g, ""));

    if (digit) {
      document.getElementById(`verification-code-${index + 1}`)?.focus();
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

  const maskedEmail = pendingAuth?.user?.email
    ? pendingAuth.user.email.replace(/^(.{2}).*(@.*)$/, "$1••••$2")
    : "your email address";

  return (
    <AuthLayout showSocialProof={false}>
      {pendingAuth ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Security check
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter the 6-digit code we sent to{" "}
            <span className="font-semibold text-foreground">{maskedEmail}</span>.
          </p>
          <form className="mt-8 space-y-6" onSubmit={handleVerificationSubmit}>
            <FormError id="login-error" message={error} />
            <Field label="Verification code">
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
                    className="h-12 w-11 rounded-lg border border-input bg-card text-center text-lg font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-12"
                    value={verificationCode[index] || ""}
                    onChange={(event) => handleCodeChange(index, event.target.value)}
                    onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  />
                ))}
              </div>
            </Field>
            <button type="submit" className={primaryButtonCls}>
              Verify and continue
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setPendingAuth(null);
                setError("");
              }}
            >
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
            <Field label="Username or email">
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
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New around here?{" "}
        <Link to="/signup" className="text-primary">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
