import { Link } from "@/i18n/navigation";

type Props = {
  href: string;
  title: string;
  description: string;
};

export function SectionCard({ href, title, description }: Props) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
    >
      <h2 className="font-display text-xl font-semibold text-[var(--accent)] group-hover:underline">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </Link>
  );
}
