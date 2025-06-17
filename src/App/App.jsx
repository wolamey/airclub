import { useState, useEffect } from "react";
import "./App.scss";
import { useNavigate, Route, Routes, useLocation } from "react-router-dom";
import Auth from "../Pages/Auth/Auth";
import Booking from "../Pages/Booking/Booking";
import MyBooking from "../Pages/MyBooking/MyBooking";

const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? cookie.split("=")[1] : null;
};

const refreshToken = async () => {
  const refreshToken = getCookie("refresh_token");
  if (!refreshToken) return null;

  const formData = new URLSearchParams();
  formData.append("grant_type", "refresh_token");
  formData.append("client_id", "SeatHub.Api");
  formData.append("refresh_token", refreshToken);

  try {
    const response = await fetch(
      "https://dev-passport.aeroclub.ru/connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      }
    );

    const data = await response.json();
    if (data.access_token) {
      document.cookie = `access_token=${data.access_token}; path=/;`;
      if (data.refresh_token) {
        document.cookie = `refresh_token=${data.refresh_token}; path=/;`;
      }
      return data.access_token;
    }
  } catch (error) {
    console.error("Ошибка обновления токена:", error);
  }
  return null;
};

function App() {
  const navigate = useNavigate();
  useEffect(() => {
    const checkToken = async () => {
      const accessToken = getCookie("access_token");

      if (!accessToken) {
        console.log("Токен отсутствует, обновляем...");
        const newToken = await refreshToken();
        if (!newToken) {
          navigate("/auth");
        }
      }
    };

    checkToken();
  }, []);
  return (
    <div className="app">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/tobook"
          element={<Booking refreshToken={refreshToken} />}
        />
        <Route path="/" element={<MyBooking  refreshToken={refreshToken}/>} />
      </Routes>
    </div>
  );
}

export default App;
