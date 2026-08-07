export function SectionHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 text-3xl font-black uppercase tracking-[-0.045em] sm:text-4xl"
      >
        {title}
      </h2>
    </header>
  );
}
