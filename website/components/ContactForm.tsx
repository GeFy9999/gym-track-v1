"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { interpolate } from "@/lib/interpolate";
import type { Dictionary } from "@/dictionaries";

type Props = { dict: Dictionary["contact"] };
type Topic = keyof Dictionary["contact"]["topics"];

const TOPICS: Topic[] = ["question", "bug", "billing", "account", "feedback", "other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sends to the backend (POST /api/contact), which forwards the message to
// support@gymstrack.com with Reply-To set to the sender.
export default function ContactForm({ dict: t }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>("question");
  const [message, setMessage] = useState("");
  // Honeypot: hidden from people, filled in by spam bots.
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t.errors.name);
    if (!EMAIL.test(email.trim())) return setError(t.errors.email);
    if (message.trim().length < 10) return setError(t.errors.message);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || t.errors.generic);
      setSentTo(email.trim());
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-[#191714] placeholder-gray-400 focus:outline-none focus:border-[#c9552c] transition-colors";
  const label = "text-sm font-semibold text-[#191714] mb-1 block";

  if (sentTo) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
        <CheckCircle2 size={40} className="text-[#3a9e6e] mx-auto mb-3" />
        <p className="text-xl font-black text-[#191714]">{t.successTitle}</p>
        <p className="text-sm mt-2">{interpolate(t.successText, { email: sentTo })}</p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="mt-4 text-sm font-semibold text-[#c9552c]"
        >
          {t.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className={label}>{t.name}</label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            maxLength={100}
            autoComplete="name"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={label}>{t.email}</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            maxLength={200}
            autoComplete="email"
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className={label}>{t.topic}</label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
          className={field}
        >
          {TOPICS.map((key) => (
            <option key={key} value={key}>
              {t.topics[key]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={label}>{t.message}</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.messagePlaceholder}
          rows={6}
          maxLength={5000}
          className={`${field} resize-y`}
        />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#e8622b] disabled:opacity-50 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-md"
      >
        {loading ? t.sending : t.submit}
      </button>
    </form>
  );
}
