import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import api, { setAuthToken } from "./api";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import Feed from "./components/Feed/Feed";
import NewPost from "./components/NewPost/NewPost";
import styles from "./App.module.scss";

function Nav({ user, onLogout }) {
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.navBrand}>
        📱 SocialHub
      </Link>
      {user && (
        <>
          <Link to="/" className={styles.navLink}>
            Feed
          </Link>
          <Link to="/new" className={styles.navLink}>
            New Post
          </Link>
        </>
      )}
      <div className={styles.navRight}>
        {user ? (
          <>
            <span className={styles.navGreeting}>👤 {user.name}</span>
            <button className={styles.btnLogout} onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.btnSecondary}>
              Log in
            </Link>
            <Link to="/register" className={styles.btnPrimary}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("mini_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("mini_token");
    setAuthToken(token);
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem("mini_user", JSON.stringify(user));
    localStorage.setItem("mini_token", token);
    setAuthToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("mini_user");
    localStorage.removeItem("mini_token");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Nav user={user} onLogout={handleLogout} />
        <main className={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Feed user={user} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/register"
              element={<Register onRegister={handleLogin} />}
            />
            <Route path="/new" element={<NewPost />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
