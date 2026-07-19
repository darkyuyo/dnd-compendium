import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { listCharacters } from "@/lib/db";
import { CharactersClient } from "@/components/CharactersClient";

type Props = { params: Promise<{ locale: string }> };

export default async function CharactersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  const characters = await listCharacters(user.id);
  return (
    <CharactersClient
      userName={user.name}
      initial={characters.map((c) => ({
        id: c.id,
        name: c.name || "Sin nombre",
        className: c.className,
        level: c.level,
        species: c.species,
        photoUrl: c.photoUrl,
        updatedAt: c.updatedAt,
      }))}
    />
  );
}
