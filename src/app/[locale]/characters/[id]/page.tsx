import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { getCharacter } from "@/lib/db";
import { CharacterSheetEditor } from "@/components/CharacterSheetEditor";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function CharacterDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  const character = await getCharacter(user.id, id);
  if (!character) notFound();
  return <CharacterSheetEditor initial={character} locale={locale} />;
}
