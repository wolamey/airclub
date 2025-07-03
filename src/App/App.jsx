// src/App.jsx
import { useEffect } from "react";
import "./App.scss";
import { useNavigate, Route, Routes } from "react-router-dom";
import Auth from "../Pages/Auth/Auth";
import Booking from "../Pages/Booking/Booking";
import MyBooking from "../Pages/MyBooking/MyBooking";

// Cookie utilities
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const setCookie = (name, value, days) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

// Fetch new tokens
const fetchToken = async () => {
  try {
    const res = await fetch("https://dev-passport.aeroclub.ru/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: "seatmap@aeroclub.ru",
        password: "allcdOeSunZa",
        grant_type: "password",
        client_id: "SeatHub.Api",
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      setCookie("access_token", data.access_token, 1);
      setCookie("refresh_token", data.refresh_token, 7);
      return data.access_token;
    }
  } catch (err) {
    console.error("Error fetching token:", err);
  }
  return null;
};

// Refresh token if expired
export const refreshToken = async () => {
  const refresh = getCookie("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch("https://dev-passport.aeroclub.ru/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: "SeatHub.Api",
        refresh_token: refresh,
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      setCookie("access_token", data.access_token, 1);
      if (data.refresh_token) setCookie("refresh_token", data.refresh_token, 7);
      return data.access_token;
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
  }
  return null;
};

// Check if telegram user is allowed (has passed email validation)
const isDomainAllowed = async (username, token) => {
  try {
    const res = await fetch(
      `https://beta-seathub.aeroclub.ru/User/user_email?TelegramAccount=${encodeURIComponent(username)}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data?.email) {
        setCookie("user_email", json.data.email, 7);
        return true;
      }
    }
  } catch (err) {
    console.error("Error checking domain:", err);
  }
  return false;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const tg = window.Telegram?.WebApp;
      const username = tg?.initDataUnsafe?.user?.username;
      // const username = 'soo';

      if (!username) {
        console.warn("Telegram username not found");
        navigate("/auth", { replace: true });
        return;
      }

      let token = getCookie("access_token");
      if (!token) token = await fetchToken();

      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      const allowed = await isDomainAllowed(username, token);
      if (allowed  ) {
        // alert('sosi')
        // navigate("/", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    };

    initAuth();
  }, [navigate]);

  return (
    <div className="app">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/tobook" element={<Booking refreshToken={refreshToken} />} />
        <Route path="/" element={<MyBooking refreshToken={refreshToken} />} />
      </Routes>
    </div>
  );
}

export default App;
