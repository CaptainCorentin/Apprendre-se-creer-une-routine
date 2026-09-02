export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent-strong"
    >
      {initial}
    </div>
  );
}
