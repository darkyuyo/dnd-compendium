import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { LoginForm } from "@/components/LoginForm";
import es from "../../../messages/es.json";

export default function LoginPage() {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center px-4">
        <NextIntlClientProvider locale="es" messages={es}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
