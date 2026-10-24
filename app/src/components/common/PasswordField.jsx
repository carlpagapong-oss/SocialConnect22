import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "@/utils/constants";

export function PasswordField({
  value,
  onChange,
  placeholder,
  minLength = 8,
  required = true,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        required={required}
        minLength={minLength}
        type={visible ? "text" : "password"}
        className={`${inputCls} pr-11`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...inputProps}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
