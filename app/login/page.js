"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SERIF = "'Cormorant Garamond', serif";
const SANS  = "'DM Sans', sans-serif";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Already signed in → go straight to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/app");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#16140F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "50%",
          border: "2px solid rgba(246,241,232,0.12)",
          borderTopColor: "#5A9E72",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#16140F",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: SANS,
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: "35%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(30,77,48,0.14) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "400px",
        background: "#1C1A14",
        border: "1px solid rgba(246,241,232,0.09)",
        borderRadius: "20px",
        padding: "3rem 2.5rem 2.75rem",
        textAlign: "center",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        animation: "cardIn 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: "32px",
              fontWeight: 400,
              color: "#F6F1E8",
              letterSpacing: "0.3px",
            }}>
              Stackr
            </span>
          </a>
          <div style={{
            width: "32px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(90,158,114,0.6), transparent)",
            margin: "1rem auto 0",
          }} />
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: "26px",
          fontWeight: 400,
          color: "#F6F1E8",
          marginBottom: "0.6rem",
          lineHeight: 1.25,
        }}>
          Begin your journey
        </h1>
        <p style={{
          fontSize: "13px",
          color: "rgba(246,241,232,0.42)",
          marginBottom: "2.5rem",
          lineHeight: 1.6,
        }}>
          Sign in to track your habits and<br />build the person you&apos;re becoming.
        </p>

        {/* Google sign-in button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/app" })}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "0.85rem 1.5rem",
            background: "#F6F1E8",
            border: "none",
            borderRadius: "10px",
            color: "#1C1A14",
            fontFamily: SANS,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "0.1px",
            transition: "background 0.18s, transform 0.15s, box-shadow 0.18s",
            boxShadow: "0 4px 20px rgba(246,241,232,0.12)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
            e.currentTarget.style.transform  = "translateY(-1px)";
            e.currentTarget.style.boxShadow  = "0 6px 28px rgba(246,241,232,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F6F1E8";
            e.currentTarget.style.transform  = "translateY(0)";
            e.currentTarget.style.boxShadow  = "0 4px 20px rgba(246,241,232,0.12)";
          }}
        >
          {/* Google "G" logo */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          margin: "1.75rem 0 0",
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(246,241,232,0.07)" }} />
          <span style={{ fontSize: "10px", color: "rgba(246,241,232,0.25)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Beta Access
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(246,241,232,0.07)" }} />
        </div>

        <p style={{
          marginTop: "1.25rem",
          fontSize: "11px",
          color: "rgba(246,241,232,0.22)",
          lineHeight: 1.6,
        }}>
          By continuing you agree to our Terms &amp; Privacy Policy.<br />
          Your data stays on your device.
        </p>
      </div>

      {/* Back to landing */}
      <a href="/" style={{
        marginTop: "1.75rem",
        fontSize: "12px",
        color: "rgba(246,241,232,0.28)",
        textDecoration: "none",
        transition: "color 0.2s",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(246,241,232,0.6)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(246,241,232,0.28)")}
      >
        ← Back to home
      </a>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
