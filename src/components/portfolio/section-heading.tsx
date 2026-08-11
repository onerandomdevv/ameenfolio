type SectionHeadingProps = {
  id: string;
  title: string;
};

export function SectionHeading({ id, title }: SectionHeadingProps) {
  return (
    <header className="flex items-center">
      <h2
        id={id}
        className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground"
      >
        {title}
      </h2>
    </header>
  );
}
