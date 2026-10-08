"use client";

import AuthScreen from "@/components/AuthScreen";

/**
 * The signup form lives inside the shared auth card so that reaching /signup
 * directly still shows it — only the opening animation is skipped.
 */
export default function SignupPage() {
  return <AuthScreen initialMode="signup" />;
}