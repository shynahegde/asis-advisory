import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Smile,
  ChevronRight,
  Phone,
  Laptop,
  Wifi,
} from "lucide-react";

const STEPS = [
  {
    number: "1",
    icon: <Phone className="w-7 h-7" aria-hidden="true" />,
    title: "Tell us your problem",
    desc: "Fill out a simple form on your phone or computer. No tech jargon — just plain English.",
  },
  {
    number: "2",
    icon: <ShieldCheck className="w-7 h-7" aria-hidden="true" />,
    title: "We figure it out",
    desc: "Our team reviews your request instantly and decides the fastest way to help you.",
  },
  {
    number: "3",
    icon: <Smile className="w-7 h-7" aria-hidden="true" />,
    title: "You're back up and running",
    desc: "We fix it remotely in minutes, or send a friendly technician to your home.",
  },
];

const FEATURES = [
  {
    icon: <Clock className="w-6 h-6 text-primary-700" aria-hidden="true" />,
    title: "Fast response",
    desc: "Remote help within 10 minutes. Onsite visits scheduled within 48 hours.",
  },
  {
    icon: <Laptop className="w-6 h-6 text-primary-700" aria-hidden="true" />,
    title: "All devices welcome",
    desc: "Computers, phones, tablets, smart home devices, and internet issues.",
  },
  {
    icon: <Wifi className="w-6 h-6 text-primary-700" aria-hidden="true" />,
    title: "No passwords needed",
    desc: "Sign in with just your phone number. Simple and secure.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="px-6 py-5 border-b border-warm-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center"
              aria-hidden="true"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-[22px] font-semibold text-gray-900">
              TechRescue
            </span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-[16px] font-semibold text-primary-700 hover:text-primary-800 min-h-0 h-auto"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white px-6 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-[15px] font-semibold px-4 py-2 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Friendly tech support for everyone
          </div>

          <h1 className="font-serif text-[42px] sm:text-[56px] font-bold text-gray-900 leading-tight mb-6 text-balance">
            Tech trouble?<br />
            <span className="text-primary-700">We&apos;ve got you.</span>
          </h1>

          <p className="text-[20px] text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto text-balance">
            Fast, friendly tech support for your home or small business.
            Get help in minutes — no jargon, no confusion, no stress.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 h-[64px] px-10 bg-primary-700 text-white rounded-xl text-[20px] font-bold hover:bg-primary-800 active:bg-primary-900 transition-colors w-full sm:w-auto"
            aria-label="Get help now — sign in or create an account"
          >
            Get Help Now
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </Link>

          <p className="mt-4 text-[15px] text-gray-400">
            Sign in with your phone number — no password needed
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-warm-50 px-6 py-16 sm:py-20" aria-labelledby="how-it-works">
        <div className="max-w-4xl mx-auto">
          <h2
            id="how-it-works"
            className="font-serif text-[34px] sm:text-[40px] font-bold text-gray-900 text-center mb-4"
          >
            Here&apos;s how it works
          </h2>
          <p className="text-[18px] text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Three simple steps. No tech knowledge required.
          </p>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ number, icon, title, desc }) => (
              <div key={number} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-700">
                  {icon}
                </div>
                <div className="text-[13px] font-bold text-primary-700 uppercase tracking-widest mb-2">
                  Step {number}
                </div>
                <h3 className="font-serif text-[20px] font-semibold text-gray-900 mb-3">
                  {title}
                </h3>
                <p className="text-[16px] text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-16 sm:py-20" aria-labelledby="features">
        <div className="max-w-4xl mx-auto">
          <h2
            id="features"
            className="font-serif text-[34px] font-bold text-gray-900 text-center mb-12"
          >
            Why TechRescue?
          </h2>

          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                  {icon}
                </div>
                <h3 className="font-serif text-[20px] font-semibold text-gray-900">{title}</h3>
                <p className="text-[16px] text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 px-6 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-[34px] sm:text-[42px] font-bold text-white mb-4 text-balance">
            Ready to get help?
          </h2>
          <p className="text-[18px] text-primary-100 mb-8 leading-relaxed">
            Describe your problem and we&apos;ll take it from there.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 h-[64px] px-10 bg-white text-primary-700 rounded-xl text-[20px] font-bold hover:bg-primary-50 transition-colors w-full sm:w-auto"
          >
            Get Help Now
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-warm-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 bg-primary-700 rounded flex items-center justify-center"
              aria-hidden="true"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[16px] font-semibold text-gray-700">TechRescue</span>
          </div>
          <p className="text-[14px] text-gray-400">
            © {new Date().getFullYear()} TechRescue. Friendly tech support for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
