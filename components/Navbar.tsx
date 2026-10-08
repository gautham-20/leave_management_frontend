"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="navbar">
      {/* This will appear on the RIGHT because of row-reverse */}
      <h1><Link href="/">Leave Space</Link></h1>

      {/* This group will appear on the LEFT */}
      <div className="nav-links">
        <Link href="/">Home</Link>
        {/* Absolute paths: relative ones resolved against /employee, /admin etc. */}
        <Link href="/aboutus">About Us</Link>
        <Link href="/contactus">Contact Us</Link>
        
        {user?.role === "EMPLOYEE" && <Link href="/employee">My Dashboard</Link>}
        {user?.role === "MANAGER" && <Link href="/manager">Approvals</Link>}
        {user?.role === "ADMIN" && (
          <>
            <Link href="/admin">HR Reports</Link>
            <Link href="/manager">Manager View</Link>
          </>
        )}

        {user ? (
          <button onClick={logout} className="btn-danger" style={{cursor: 'pointer', borderRadius: '4px'}}>
            Logout ({user.name})
          </button>
        ) : (
          // Held back until the stored session is checked, otherwise the login
          // links flash on every refresh before the user reappears.
          !loading && (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}