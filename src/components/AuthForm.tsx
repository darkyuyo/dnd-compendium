"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password }
        : { name, email, password };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al autenticar");
      return;
    }
    router.push("/characters");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--accent)]">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {mode === "login"
            ? "Entra para gestionar tus personajes."
            : "Regístrate para guardar hojas de personaje."}
        </p>
      </div>

      {mode === "register" ? (
        <label className="block text-sm font-medium">
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
          />
        </label>
      ) : null}

      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          required
        />
      </label>

      <label className="block text-sm font-medium">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          required
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-semibold text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-60"
      >
        {loading
          ? "…"
          : mode === "login"
            ? "Entrar"
            : "Registrarme"}
      </button>

      <p className="text-center text-sm text-[var(--muted)]">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[var(--accent)] underline">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[var(--accent)] underline">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
