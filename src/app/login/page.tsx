"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, isFirebaseConfigured, googleProvider } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { LogIn, UserPlus, LogOut, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { user, isAuthorized, authorizedEmails, logout, loading } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;

    setError("");
    setSuccess("");
    setAuthLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("¡Cuenta creada con éxito! Ahora estás conectado.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Sesión iniciada correctamente.");
      }
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Ocurrió un error al autenticar.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "El correo ya está en uso.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errorMsg = "Credenciales incorrectas.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Formato de correo inválido.";
      }
      setError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isFirebaseConfigured) return;

    setError("");
    setSuccess("");
    setAuthLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Sesión iniciada con Google correctamente.");
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Error al conectar con Google.";
      if (err.code === "auth/popup-blocked") {
        errorMsg = "El navegador bloqueó la ventana emergente de Google.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errorMsg = "La ventana de Google se cerró antes de completar el inicio de sesión.";
      }
      setError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">El Corcho Guardado</h1>
      <p className="page-subtitle">Acceso de Administradores</p>

      {/* Show configuration warning if Firebase is not setup */}
      {!isFirebaseConfigured && (
        <div className="setup-warning">
          <div className="setup-warning-title">
            <AlertTriangle size={18} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Firebase no configurado
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-color)" }}>
            Configura tus credenciales de Firebase en el archivo <code>.env.local</code>. 
            Puedes guiarte con el archivo de plantilla <code>.env.local.example</code>.
          </p>
        </div>
      )}

      {user ? (
        // Profile view when logged in
        <div className="profile-card glass">
          <div className="profile-avatar">
            {user.email ? user.email.substring(0, 2).toUpperCase() : "U"}
          </div>
          
          <h2 className="profile-email">{user.email}</h2>
          
          {isAuthorized ? (
            <div className="profile-role-badge authorized">
              <CheckCircle size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Administrador (Permiso de Escritura)
            </div>
          ) : (
            <div className="profile-role-badge visitor">
              <ShieldAlert size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Visitante (Solo Lectura)
            </div>
          )}

          {!isAuthorized && (
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "left", fontSize: "0.85rem" }}>
              <p style={{ color: "var(--cork-base)", fontWeight: 600, marginBottom: "4px" }}>¿Por qué soy visitante?</p>
              <p style={{ fontSize: "0.8rem" }}>
                Solo los correos especificados en la lista de autorizados pueden registrar o borrar vinos.
              </p>
              <p style={{ marginTop: "8px", fontSize: "0.8rem", color: "var(--cork-light)" }}>
                <strong>Correos autorizados:</strong> {authorizedEmails.join(", ") || "Ninguno configurado"}
              </p>
            </div>
          )}

          {isAuthorized && (
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "left", fontSize: "0.85rem" }}>
              <p style={{ color: "var(--cork-base)", fontWeight: 600, marginBottom: "4px" }}>Acceso total concedido</p>
              <p style={{ fontSize: "0.8rem" }}>
                Tienes permisos para añadir nuevos vinos y eliminar los registros existentes de la base de datos.
              </p>
            </div>
          )}

          <button className="btn btn-secondary" onClick={logout}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      ) : (
        // Login / Register Form
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid var(--border-color)" }}>
            <button
              onClick={() => { setIsRegistering(false); setError(""); setSuccess(""); }}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                color: !isRegistering ? "var(--cork-light)" : "var(--text-muted)",
                padding: "12px 0",
                fontSize: "1rem",
                fontWeight: 600,
                borderBottom: !isRegistering ? "2px solid var(--wine-color)" : "none",
                cursor: "pointer"
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegistering(true); setError(""); setSuccess(""); }}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                color: isRegistering ? "var(--cork-light)" : "var(--text-muted)",
                padding: "12px 0",
                fontSize: "1rem",
                fontWeight: 600,
                borderBottom: isRegistering ? "2px solid var(--wine-color)" : "none",
                cursor: "pointer"
              }}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(114, 47, 55, 0.15)", border: "1px solid var(--wine-color)", color: "#ff9eaf", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(46, 125, 50, 0.15)", border: "1px solid #2e7d32", color: "#a5d6a7", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isFirebaseConfigured || authLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isFirebaseConfigured || authLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn" 
              style={{ marginTop: "10px" }}
              disabled={!isFirebaseConfigured || authLoading}
            >
              {authLoading ? "Procesando..." : (
                isRegistering ? (
                  <>
                    <UserPlus size={18} />
                    Crear Cuenta
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )
              )}
            </button>
          </form>

          <div style={{ margin: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <span style={{ height: "1px", background: "var(--border-color)", flex: 1 }}></span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>o</span>
            <span style={{ height: "1px", background: "var(--border-color)", flex: 1 }}></span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoogleAuth}
            disabled={!isFirebaseConfigured || authLoading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.77-.07-1.54-.2-2.29H12v4.39h6.6c-.29 1.5-.12 3-.1 4.51l3.8 2.94c2.23-2.06 3.44-5.09 3.44-8.55z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.8-2.94c-1.08.73-2.46 1.16-4.16 1.16-3.19 0-5.89-2.15-6.85-5.05l-3.92 3.03C3.18 21.02 7.23 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.15 14.26c-.25-.73-.39-1.51-.39-2.31s.14-1.58.39-2.31L1.23 6.6C.44 8.2.01 9.96.01 11.95s.43 3.75 1.22 5.35l3.92-3.04z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.23 0 3.18 2.98 1.23 6.97l3.92 3.04c.96-2.9 3.66-5.05 6.85-5.05z"
              />
            </svg>
            <span>Acceder con Google</span>
          </button>
        </div>
      )}
    </div>
  );
}

