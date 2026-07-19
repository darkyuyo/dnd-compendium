import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="py-10">
      <AuthForm mode="register" />
    </div>
  );
}
