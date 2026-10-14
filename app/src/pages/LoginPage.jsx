import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field } from "@/components/common/Field";
import { FormError } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { inputCls, primaryButtonCls } from "@/utils/constants";

export default function LoginPage() {
  usePageTitle("Log in — Social Connect");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.identifier, form.password);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <p className="text-xs font-semibold uppercase text-primary">Welcome back</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Good to see you again</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your details to get back to your circle.
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormError message={error} />
        <Field label="Username or Gmail">
          <input
            required
            className={inputCls}
            placeholder="you@gmail.com"
            value={form.identifier}
            onChange={set("identifier")}
          />
        </Field>
        <Field label="Password">
          <input
            required
            minLength={8}
            type="password"
            className={inputCls}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set("password")}
          />
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-secondary-foreground">
            <input type="checkbox" className="accent-primary" /> Remember me
          </label>
          <a href="#" className="text-primary">
            Forgot password?
          </a>
        </div>
        <button disabled={submitting} className={primaryButtonCls}>
          {submitting ? "Logging in..." : "Log in to Social Connect"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New around here?{" "}
        <Link to="/signup" className="text-primary">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
