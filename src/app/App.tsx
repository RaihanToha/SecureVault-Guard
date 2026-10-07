import React, { useState } from "react";
import { Navbar, type AppPage } from "./components/Navbar";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { OTPVerification } from "./components/OTPVerification";
import { Dashboard } from "./components/Dashboard";
import { PasswordVault } from "./components/PasswordVault";
import { PasswordTools } from "./components/PasswordTools";
import { FileVault } from "./components/FileVault";
import { SecurityLogs } from "./components/SecurityLogs";
import { UserProfile } from "./components/UserProfile";
import { UserProvider, useUser } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Shield, Loader2 } from "lucide-react";

type AuthMode = "login" | "register";

function MainApp() {
  const {
    firebaseUser,
    authLoading,
    profile,
    isMfaVerified,
    setIsMfaVerified,
    logout,
  } = useUser();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");

  // Loading Screen while Firebase checks stored token
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#0B5CE5] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-[#0B5CE5]" />
            <span>Connecting to SecureVault Guard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login or Register
  if (!firebaseUser) {
    if (authMode === "register") {
      return (
        <Register
          onRegisterSuccess={() => setAuthMode("login")}
          onLogin={() => setAuthMode("login")}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={() => {
          // Handled by onAuthStateChanged + 2FA check below
        }}
        onRegister={() => setAuthMode("register")}
      />
    );
  }

  // If user is logged in, but 2FA is active and not yet OTP verified -> OTP Screen
  if (profile.twoFactorEnabled && !isMfaVerified) {
    return (
      <OTPVerification
        onVerify={() => setIsMfaVerified(true)}
        onBlocked={() => logout()}
        onBack={() => logout()}
      />
    );
  }

  // Fully Authenticated App Experience
  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col w-full overflow-x-hidden transition-colors">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={async () => {
          await logout();
          setCurrentPage("dashboard");
        }}
      />
      <main className="flex-1 w-full pb-8">
        {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === "password-vault" && <PasswordVault />}
        {currentPage === "password-tools" && <PasswordTools />}
        {currentPage === "file-vault" && <FileVault />}
        {currentPage === "security-logs" && <SecurityLogs />}
        {currentPage === "profile" && <UserProfile />}
      </main>

      {/* Footer matching Page 26 of Capstone Project Diary */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 py-4 px-4 text-center text-xs text-gray-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-gray-700 dark:text-slate-200">Your security is important to us</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            SecureVault Guard • Victoria University NIT3004 Capstone Project 2 (Group 06) • Supervisor: Dr Fakhra Jabeen
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <MainApp />
      </UserProvider>
    </ThemeProvider>
  );
}
