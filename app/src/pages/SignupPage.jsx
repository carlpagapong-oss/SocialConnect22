import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Field } from "@/components/common/Field";
import { FormError } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { GENDERS, inputCls, primaryButtonCls } from "@/utils/constants";

const initialForm = { name: "", birthday: "", gender: "", username: "", email: "", password: "" };

export default function SignupPage() {
  usePageTitle("Create an account — Social Connect");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <p className="text-xs font-semibold uppercase text-primary">Join the circle</p>
      <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">It only takes a minute to get started.</p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormError message={error} />
        <Field label="Full name">
          <input
            required
            className={inputCls}
            placeholder="e.g. Maya Collins"
            value={form.name}
            onChange={set("name")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Birthday">
            <input
              required
              type="date"
              className={inputCls}
              value={form.birthday}
              onChange={set("birthday")}
            />
          </Field>
          <Field label="Gender">
            <select required className={inputCls} value={form.gender} onChange={set("gender")}>
              <option value="" disabled>
                Select gender
              </option>
              {GENDERS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Username">
          <input
            required
            className={inputCls}
            placeholder="@username"
            value={form.username}
            onChange={set("username")}
          />
        </Field>
        <Field label="Gmail">
          <input
            required
            type="email"
            className={inputCls}
            placeholder="you@gmail.com"
            value={form.email}
            onChange={set("email")}
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
        <button disabled={submitting} className={primaryButtonCls}>
          {submitting ? "Creating account..." : "Create my account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/" className="text-primary">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
