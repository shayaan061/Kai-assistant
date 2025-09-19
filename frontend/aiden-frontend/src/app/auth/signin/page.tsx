"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="p-10 bg-gray-900 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Login to Kai</h1>
        <button
          onClick={() => signIn("google")}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
