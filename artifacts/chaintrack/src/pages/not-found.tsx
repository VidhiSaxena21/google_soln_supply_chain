import { Link } from "wouter";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-slate-700" />
        </div>
        <h1 className="text-white font-bold text-2xl mb-2">404 — Not Found</h1>
        <p className="text-slate-500 mb-6">This page doesn't exist.</p>
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}
