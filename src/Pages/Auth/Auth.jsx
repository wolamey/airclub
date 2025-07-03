
// src/Pages/Auth/Auth.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import closeSquare from "../../assets/close-square.svg";
import "./Auth.scss";

export default function Auth() {
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [telegramAccount, setTelegramAccount] = useState("");
  const navigate = useNavigate();
  const API = "https://beta-seathub.aeroclub.ru/User";

  // Reuse cookie utils
  const setCookie = (name, value, days) => {
    const expires = days
      ? "; expires=" + new Date(Date.now() + days * 864e5).toUTCString()
      : "";
    document.cookie = `${name}=${value}${expires}; path=/`;
  };
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };

  // Unified fetch with error handling
  const safeFetch = async (url, opts) => {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      const username = tg.initDataUnsafe?.user?.username;
      // const username = 'soo';

      if (username) setTelegramAccount(username);
      else {
        setErrorMessage("Telegram username не найден");
      }
    }
  }, []);

  // Step 1: send validation code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const tokenRes = await safeFetch(
        "https://dev-passport.aeroclub.ru/connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: "seatmap@aeroclub.ru",
            password: "allcdOeSunZa",
            grant_type: "password",
            client_id: "SeatHub.Api",
          }),
        }
      );

      setCookie("access_token", tokenRes.access_token, 1);
      setCookie("refresh_token", tokenRes.refresh_token, 7);

      await safeFetch(`${API}/send_validation_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRes.access_token}`,
        },
        body: JSON.stringify({ email: userEmail, telegramAccount }),
      });

      setStep(2);
    } catch (err) {
      console.log(err);

  const match = err.message.match(/"error"\s*:\s*"([^"]+)"/);
  if (match && match[1]) {
    setErrorMessage(match[1]);
  } else {
    setErrorMessage(err.message);
  }
    }
  };

  // Step 2: verify code and navigate
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const token = getCookie("access_token");
      const res = await safeFetch(`${API}/validate_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ validationCode, telegramAccount }),
      });

      setCookie("user_email", res.data.email || userEmail, 7);
      navigate("/", { replace: true });
    } catch (err) {
 const match = err.message.match(/"error"\s*:\s*"([^"]+)"/);
  if (match && match[1]) {
    setErrorMessage(match[1]);
  } else {
    setErrorMessage(err.message);
  }    }
  };

  return (
    <div className="auth">
      {step === 1 && (
        <>
          <p className="title auth_title">Введите ваш email</p>
          <form className="auth_form" onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Ваш email"
              className="input auth_input"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
            <button type="submit" className="rbutton button auth_submit">
              Получить код
            </button>
          </form>
        </>
      )}
      {step === 2 && (
        <>
          <p className="title auth_title">Код из письма</p>
          <form className="auth_form" onSubmit={handleCodeSubmit}>
            <input
              type="text"
              placeholder="Введите код"
              className="input auth_input"
              value={validationCode}
              onChange={(e) => setValidationCode(e.target.value)}
              required
            />
            <button type="submit" className="rbutton button auth_submit">
              Подтвердить
            </button>
          </form>
        </>
      )}
      {errorMessage && (
        <div className="page_popup">
          <div className="auth_popup_container">
            <div className="auth_popup_wrapper">
              <img
                src={closeSquare}
                alt="close"
                onClick={() => setErrorMessage("")}
              />
              <p className="auth_popup_container_title">{errorMessage}</p>
              <p className="auth_popup_container_text">
              Повторите попытку или обратитесь в
            </p>
            <a
              href="https://myteam.aeroclub.ru/servicedesk/customer/portal/21/create/204"
              className="auth_popup_container_link"
            >
              Service Desk
            </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
