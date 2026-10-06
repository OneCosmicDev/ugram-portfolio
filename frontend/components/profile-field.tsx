export function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex justify-between border-b border-zinc-300 dark:border-zinc-700 py-2 mb-2">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

export function FormInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-sm font-medium text-zinc-400">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="
          rounded-xl
          border border-zinc-700
          bg-zinc-900
          text-white
          px-4 py-3
          placeholder:text-zinc-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          transition
        "
      />
    </div>
  );
}
