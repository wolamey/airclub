import { useEffect } from "react";
import "./App.scss";
import { useNavigate, Route, Routes } from "react-router-dom";
import Auth from "../Pages/Auth/Auth";
import Booking from "../Pages/Booking/Booking";
import MyBooking from "../Pages/MyBooking/MyBooking";

const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

const setCookie = (name, value, days) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

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
      console.log(data)

    if (data.access_token) {
      setCookie("access_token", data.access_token, 1);
      setCookie("refresh_token", data.refresh_token, 7);
      console.log(data)
      return data.access_token;
    }
  } catch (err) {
    console.error("Ошибка получения токена:", err);
  }
  return null;
};

const refreshToken = async () => {
  const refreshToken = getCookie("refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch("https://dev-passport.aeroclub.ru/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: "SeatHub.Api",
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      setCookie("access_token", data.access_token, 1);
      if (data.refresh_token) {
        setCookie("refresh_token", data.refresh_token, 7);
      }
      return data.access_token;
    }
  } catch (err) {
    console.error("Ошибка обновления токена:", err);
  }
  return null;
};

const isDomainAllowed = async (username, token) => {
  console.log(username)
  console.log(token)
  try {
    const res = await fetch(
      `https://beta-seathub.aeroclub.ru/User/user_email?TelegramAccount=${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      }
    );

    if (res.status === 200) {
      const data = await res.json();
      setCookie('user_email',data.data.email )
      console.log(data.data.email)
      return true;
    }
  } catch (err) {
    console.error("Ошибка проверки юзернейма:", err);
  }
  return false;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const tg = window.Telegram?.WebApp;
      // const username = 'unknown_username';
      const username = tg?.initDataUnsafe?.user?.username;

      if (!username) {
        console.warn("Telegram username не найден");
        navigate("/auth");
        return;
      }

      let token = getCookie("access_token");
      if (!token) {
        token = await fetchToken();
      }

      if (!token) {
        navigate("/auth");
        return;
      }

      const allowed = await isDomainAllowed(username, token);

      if (allowed) {
        console.log(allowed)
        navigate("/");
      } else {
        console.log(allowed)

        navigate("/auth");
      }
    };

    init();
  }, []);

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
