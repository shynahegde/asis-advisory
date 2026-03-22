"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Wifi,
  Home,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase-browser";
import type { DeviceType } from "@/lib/types";

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  title: string;
  description: string;
  deviceType: DeviceType | "";
  os: string;
  notificationPreference: "sms" | "whatsapp";
}

const DEVICE_OPTIONS: { type: DeviceType; icon: React.ReactNode; label: string; desc: string }[] = [
  { type: "Desktop", icon: <Monitor className="w-7 h-7" aria-hidden="true" />, label: "Desktop Computer", desc: "Tower or all-in-one" },
  { type: "Laptop", icon: <Laptop className="w-7 h-7" aria-hidden="true" />, label: "Laptop", desc: "MacBook, Windows laptop" },
  { type: "Phone", icon: <Smartphone className="w-7 h-7" aria-hidden="true" />, label: "Phone", desc: "iPhone or Android" },
  { type: "Tablet", icon: <Tablet className="w-7 h-7" aria-hidden="true" />, label: "Tablet", desc: "iPad or Android tablet" },
  { type: "Smart Home", icon: <Home className="w-7 h-7" aria-hidden="true" />, label: "Smart Home Device", desc: "Alexa, Google Home, etc." },
  { type: "Network", icon: <Wifi className="w-7 h-7" aria-hidden="true" />, label: "Internet / Network", desc: "Router, WiFi, modem" },
  { type: "Other", icon: <HelpCircle className="w-7 h-7" aria-hidden="true" />, label: "Something Else", desc: "Printer, TV, other device" },
];

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketResult, setTicketResult] = useState<{
    ticketId: string;
    severity: string;
    summary: string;
    firstSteps: string[];
  } | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    title: "",
    description: "",
    deviceType: "",
    os: "",
    notificationPreference: "sms",
  });

  // Load user profile
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      // Try to prefill name
      supabase
        .from("users")
        .select("name, notification_preference")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }: { data: { name: string | null; notification_preference: string } | null }) => {
          if (profile?.name) {
            setForm((f) => ({ ...f, name: profile.name || "" }));
          }
          if (profile?.notification_preference) {
            setForm((f) => ({
              ...f,
              notificationPreference: profile.notification_preference as "sms" | "whatsapp",
            }));
          }
        });
    });
  }, [router]);

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  }

  function validateStep1() {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Please enter your name so we know who to help.";
    if (!form.title.trim()) newErrors.title = "Please describe your issue in a few words.";
    if (!form.description.trim() || form.description.trim().length < 20) {
      newErrors.description = "Please tell us more — at least a sentence or two helps us help you faster.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2() {
    if (!form.deviceType) {
      toast({ variant: "warning", title: "Please select a device type." });
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          deviceType: form.deviceType,
          os: form.os || undefined,
          notificationPreference: form.notificationPreference,
          name: form.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast({
          variant: "error",
          title: "Something went wrong",
          description: data.error || "Please try again in a moment.",
        });
        return;
      }

      setTicketResult(data);
      setSubmitted(true);

      // Update name if changed
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && form.name) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("users") as any).update({ name: form.name }).eq("id", user.id);
      }
    } catch {
      toast({
        variant: "error",
        title: "Connection issue",
        description: "Please check your internet and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (submitted && ticketResult) {
    return (
      <div className="min-h-screen bg-white">
        <header className="px-6 py-5 border-b border-warm-100">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="font-serif text-[20px] font-semibold text-gray-900">TechRescue</span>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success-600" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-[32px] font-bold text-gray-900 mb-3">
              You&apos;re all set!
            </h1>
            <p className="text-[18px] text-gray-600 leading-relaxed">
              We&apos;ve received your request and will be in touch shortly.
            </p>
          </div>

          <div className="bg-warm-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[16px] text-gray-500 font-medium">Your ticket number</span>
              <span className="font-mono text-[18px] font-bold text-primary-700">{ticketResult.ticketId}</span>
            </div>
            <div className="border-t border-warm-200 pt-4">
              <p className="text-[16px] font-medium text-gray-700 mb-2">
                {ticketResult.severity === "remote"
                  ? "📞 We'll reach out within 10 minutes"
                  : "📅 A technician will contact you within 48 hours"}
              </p>
              <p className="text-[16px] text-gray-600">{ticketResult.summary}</p>
            </div>
          </div>

          {ticketResult.firstSteps.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-3">
                While you wait, you could try:
              </h2>
              <ul className="space-y-2">
                {ticketResult.firstSteps.slice(0, 3).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-[16px] text-gray-700">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(`/status/${ticketResult.ticketId}`)}
              size="xl"
              className="w-full"
            >
              Check My Request Status
            </Button>
            <Button
              onClick={() => {
                setSubmitted(false);
                setTicketResult(null);
                setStep(1);
                setForm({ name: form.name, title: "", description: "", deviceType: "", os: "", notificationPreference: form.notificationPreference });
              }}
              variant="outline"
              size="default"
              className="w-full"
            >
              Submit Another Request
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-5 border-b border-warm-100">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-serif text-[20px] font-semibold text-gray-900">TechRescue</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[15px] text-gray-500 hover:text-gray-700 min-h-0"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {([1, 2, 3] as Step[]).map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-2 ${s === step ? "text-primary-700" : s < step ? "text-success-600" : "text-gray-400"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${
                      s === step
                        ? "bg-primary-700 text-white"
                        : s < step
                        ? "bg-success-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  <span className="text-[14px] font-medium hidden sm:block">
                    {s === 1 ? "Your issue" : s === 2 ? "Your device" : "Confirm"}
                  </span>
                </div>
                {s < 3 && <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[15px] text-gray-500">Step {step} of 3</p>
        </div>

        {/* Step 1 — Issue details */}
        {step === 1 && (
          <div>
            <h1 className="font-serif text-[28px] font-bold text-gray-900 mb-2">
              Tell us what&apos;s going on
            </h1>
            <p className="text-[17px] text-gray-600 mb-8 leading-relaxed">
              The more detail you share, the faster we can help you.
            </p>

            <div className="flex flex-col gap-6">
              <Input
                label="Your name"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
              />

              <Input
                label="What's the problem? (in a few words)"
                hint="Example: Computer won't turn on, WiFi keeps disconnecting"
                placeholder="My computer keeps freezing..."
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                error={errors.title}
              />

              <Textarea
                label="Tell us more about what's happening"
                hint="Include what you've already tried, when it started, and any error messages you see."
                placeholder="It started yesterday after the Windows update. I've tried restarting three times but it still freezes after about 5 minutes..."
                rows={5}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                error={errors.description}
              />
            </div>

            <Button
              onClick={handleNext}
              size="xl"
              className="w-full mt-8"
            >
              Continue
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Step 2 — Device type */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[16px] text-gray-500 hover:text-gray-700 mb-6 -ml-1 min-h-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>

            <h1 className="font-serif text-[28px] font-bold text-gray-900 mb-2">
              What type of device is it?
            </h1>
            <p className="text-[17px] text-gray-600 mb-8">
              Pick the one that best describes what you need help with.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8" role="group" aria-label="Device type">
              {DEVICE_OPTIONS.map(({ type, icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => update("deviceType", type)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all min-h-[72px] ${
                    form.deviceType === type
                      ? "border-primary-700 bg-primary-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-warm-50"
                  }`}
                  aria-pressed={form.deviceType === type}
                >
                  <div className={`flex-shrink-0 ${form.deviceType === type ? "text-primary-700" : "text-gray-500"}`}>
                    {icon}
                  </div>
                  <div>
                    <div className={`text-[17px] font-semibold ${form.deviceType === type ? "text-primary-700" : "text-gray-900"}`}>
                      {label}
                    </div>
                    <div className="text-[14px] text-gray-500">{desc}</div>
                  </div>
                  {form.deviceType === type && (
                    <CheckCircle className="w-5 h-5 text-primary-700 ml-auto flex-shrink-0" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            <Input
              label="Operating system (optional)"
              hint="Example: Windows 11, macOS Sonoma, iOS 17"
              placeholder="Windows 11"
              value={form.os}
              onChange={(e) => update("os", e.target.value)}
            />

            <Button
              onClick={handleNext}
              size="xl"
              className="w-full mt-8"
              disabled={!form.deviceType}
            >
              Continue
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Step 3 — Confirm & notification preference */}
        {step === 3 && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-[16px] text-gray-500 hover:text-gray-700 mb-6 -ml-1 min-h-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>

            <h1 className="font-serif text-[28px] font-bold text-gray-900 mb-2">
              Almost done — confirm your request
            </h1>
            <p className="text-[17px] text-gray-600 mb-8">
              Take a quick look, then tap &quot;Get Help Now&quot; to submit.
            </p>

            {/* Summary */}
            <div className="bg-warm-50 rounded-xl p-5 mb-6 space-y-3">
              <div>
                <span className="text-[14px] font-semibold text-gray-500 uppercase tracking-wide">Issue</span>
                <p className="text-[17px] text-gray-900 mt-1">{form.title}</p>
              </div>
              <div className="border-t border-warm-200 pt-3">
                <span className="text-[14px] font-semibold text-gray-500 uppercase tracking-wide">Details</span>
                <p className="text-[16px] text-gray-700 mt-1 leading-relaxed">{form.description}</p>
              </div>
              <div className="border-t border-warm-200 pt-3">
                <span className="text-[14px] font-semibold text-gray-500 uppercase tracking-wide">Device</span>
                <p className="text-[17px] text-gray-900 mt-1">
                  {form.deviceType}{form.os ? ` · ${form.os}` : ""}
                </p>
              </div>
            </div>

            {/* Notification preference */}
            <div className="mb-8">
              <p className="text-[18px] font-semibold text-gray-800 mb-3">
                How should we contact you?
              </p>
              <div className="flex gap-3" role="group" aria-label="Contact preference">
                {(["sms", "whatsapp"] as const).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => update("notificationPreference", pref)}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-semibold text-[16px] transition-all min-h-[56px] ${
                      form.notificationPreference === pref
                        ? "border-primary-700 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    aria-pressed={form.notificationPreference === pref}
                  >
                    {pref === "sms" ? "📱 Text message" : "💬 WhatsApp"}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              size="xl"
              className="w-full"
              loading={loading}
            >
              Get Help Now
            </Button>

            <p className="text-[14px] text-gray-400 text-center mt-4">
              Submitting sends a confirmation to your phone.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
