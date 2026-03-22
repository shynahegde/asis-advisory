"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");

  function validatePhone(value: string) {
    const cleaned = value.replace(/\D/g, "");
    if (!value.trim()) return "Please enter your phone number.";
    if (cleaned.length < 10) return "Please enter a valid phone number with area code.";
    return "";
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    const error = validatePhone(phone);
    if (error) {
      setPhoneError(error);
      return;
    }
    setPhoneError("");
    setLoading(true);

    try {
      // Normalize phone to E.164
      const normalized = phone.startsWith("+") ? phone : `+1${phone.replace(/\D/g, "")}`;

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPhoneError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Store normalized phone for OTP verification
      setPhone(normalized);
      setStep("otp");
      toast({
        variant: "success",
        title: "Code sent!",
        description: `We sent a 6-digit code to ${normalized}.`,
      });
    } catch {
      setPhoneError("Unable to send code. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) {
      setOtpError("Please enter the verification code we sent you.");
      return;
    }
    setOtpError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Invalid code. Please try again.");
        return;
      }

      toast({
        variant: "success",
        title: "You're in!",
        description: "Welcome to TechRescue.",
      });

      // Redirect based on role
      if (data.user?.role === "technician") {
        router.push("/tech/dashboard");
      } else {
        router.push("/submit");
      }
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        toast({
          variant: "success",
          title: "New code sent!",
          description: "Check your messages for a new verification code.",
        });
        setOtp("");
        setOtpError("");
      }
    } catch {
      toast({
        variant: "error",
        title: "Couldn't resend",
        description: "Please wait a moment and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-warm-100">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center" aria-hidden="true">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-[20px] font-semibold text-gray-900">TechRescue</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8" aria-label="Progress">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold transition-colors ${
                  step === "phone"
                    ? "bg-primary-700 text-white"
                    : "bg-success-600 text-white"
                }`}
                aria-current={step === "phone" ? "step" : undefined}
              >
                {step === "phone" ? "1" : "✓"}
              </div>
              <span className={`text-[16px] font-medium ${step === "phone" ? "text-primary-700" : "text-gray-500"}`}>
                Your number
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-200" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold transition-colors ${
                  step === "otp"
                    ? "bg-primary-700 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
                aria-current={step === "otp" ? "step" : undefined}
              >
                2
              </div>
              <span className={`text-[16px] font-medium ${step === "otp" ? "text-primary-700" : "text-gray-400"}`}>
                Verify code
              </span>
            </div>
          </div>

          {step === "phone" ? (
            <div>
              <h1 className="font-serif text-[32px] font-bold text-gray-900 mb-3">
                Sign in or sign up
              </h1>
              <p className="text-[18px] text-gray-600 mb-8 leading-relaxed">
                We&apos;ll send a quick verification code to your phone. No password needed.
              </p>

              <form onSubmit={handleSendOTP} className="flex flex-col gap-6" noValidate>
                <Input
                  label="Your phone number"
                  hint="Example: (555) 123-4567"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError("");
                  }}
                  error={phoneError}
                  aria-required="true"
                />

                <Button
                  type="submit"
                  size="xl"
                  loading={loading}
                  className="w-full"
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  Send Verification Code
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </form>

              <p className="mt-6 text-[15px] text-gray-500 text-center leading-relaxed">
                By signing in, you agree to our terms of service. Your phone number is your account — we&apos;ll never share it.
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setStep("phone"); setOtp(""); setOtpError(""); }}
                className="flex items-center gap-2 text-[16px] text-gray-500 hover:text-gray-700 mb-6 -ml-1 min-h-0"
                aria-label="Go back to phone number step"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Change number
              </button>

              <h1 className="font-serif text-[32px] font-bold text-gray-900 mb-3">
                Enter your code
              </h1>
              <p className="text-[18px] text-gray-600 mb-8 leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-gray-900">{phone}</span>.
                It may take a moment to arrive.
              </p>

              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-6" noValidate>
                <Input
                  label="Verification code"
                  hint="Enter the 6-digit code from your text message"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    if (otpError) setOtpError("");
                  }}
                  error={otpError}
                  aria-required="true"
                />

                <Button
                  type="submit"
                  size="xl"
                  loading={loading}
                  className="w-full"
                >
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  Verify &amp; Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[16px] text-gray-500 mb-2">Didn&apos;t get a code?</p>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-[16px] text-primary-700 font-semibold hover:underline disabled:opacity-50 min-h-0"
                >
                  Send a new code
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
