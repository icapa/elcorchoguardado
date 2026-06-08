"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wine, PlusCircle, User, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthorized } = useAuth();

  return (
    <nav className="navbar glass">
      <Link href="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
        <Wine size={22} />
        <span>Vitrina</span>
      </Link>

      {isAuthorized && (
        <Link href="/add" className={`nav-item ${pathname === "/add" ? "active" : ""}`}>
          <PlusCircle size={22} />
          <span>Añadir</span>
        </Link>
      )}

      <Link 
        href="/login" 
        className={`nav-item ${pathname === "/login" ? "active" : ""}`}
      >
        {user ? (
          <>
            <User size={22} />
            <span>Perfil</span>
          </>
        ) : (
          <>
            <LogIn size={22} />
            <span>Acceder</span>
          </>
        )}
      </Link>
    </nav>
  );
}
