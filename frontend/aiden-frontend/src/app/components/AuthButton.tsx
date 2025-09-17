"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return null; 
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-4 py-2 rounded"
    >
      Login
    </button>
  );
}
