"use client";

import { FormEvent, useEffect, useState } from "react";
import { useApp } from "@/providers/app-provider";
import { login } from "@/services/auth/auth";
import { handleError } from "@/utils/errors";
import { getDefaultDashboardPath } from "@/utils/roles";

const PARTNER_DOMAIN_KEY = "partner_domain";

export default function LoginForm() {
  const { authStatus, me } = useApp();
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedDomain = window.localStorage.getItem(PARTNER_DOMAIN_KEY);
    if (savedDomain) {
      setDomain(savedDomain);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated" && me) {
      window.location.replace(getDefaultDashboardPath(me.user.role));
    }
  }, [authStatus, me]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      setError("กรุณาระบุ Domain (Partner slug)");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        domain: trimmedDomain,
        email,
        password,
      });
      window.localStorage.setItem(PARTNER_DOMAIN_KEY, trimmedDomain);
      window.location.replace(getDefaultDashboardPath(result.user.role));
      return;
    } catch (submitError) {
      setError(handleError(submitError).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="logo"
            className="mx-auto h-10 mb-6 object-contain"
          />
          <p className="mt-2 text-sm text-gray-100">เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="domain"
                className="mb-2 block text-sm font-medium text-defualt-text"
              >
                โดเมน
              </label>
              <input
                id="domain"
                type="text"
                autoComplete="organization"
                required
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="my-partner"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-defualt-text outline-none transition focus:border-brown-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-defualt-text"
              >
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-defualt-text outline-none transition focus:border-brown-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-defualt-text"
              >
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-defualt-text outline-none transition focus:border-brown-100"
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-100">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
