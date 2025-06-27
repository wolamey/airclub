import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import closeSquare from "../../assets/close-square.svg";
import "./Auth.scss";

export default function Auth() {
  const [step, setStep] = useState(1);
  const [popState, setPopState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const navigate = useNavigate();
 const [telegramAccount, setTelegramAccount] = useState("");

  useEffect(() => {
    // Telegram WebApp SDK
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Разрешаем WebApp крутиться
      tg.ready();
      // Берём небезопасные данные, там есть user.username
      const user = tg.initDataUnsafe?.user;
      if (user?.username) {
        setTelegramAccount(user.username);
      }
    }
  }, []);
  const API = "https://beta-seathub.aeroclub.ru/User";

  // Helpers для куки
  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const d = new Date();
      d.setTime(d.getTime() + days * 86400 * 1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
  };
  const getCookie = (name) => {
    const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return m ? m[2] : null;
  };

  // Универсальный fetch с проверкой статуса и JSON-парсером
  const safeFetch = async (url, opts) => {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  };

  // 1. Логин + получение токенов + проверка домена + отправка кода
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      // 1.1. Стандартный OAuth-парольный поток
      const tokenRes = await safeFetch(
        "https://dev-passport.aeroclub.ru/connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            username: login,
            password: password,
            grant_type: "password",
            client_id: "SeatHub.Api",
          }).toString(),
        }
      );
      // 1.2. Сохраняем куки
      setCookie("access_token", tokenRes.access_token, 1);
      setCookie("refresh_token", tokenRes.refresh_token, 7);
      setCookie("user_email", login, 7);

      // 1.3. Проверяем домен пользователя
      const domain = login.split("@")[1];
 const token = getCookie("access_token");

const domRes = await safeFetch(
  `${API}/is_domain_allowed?domain=${encodeURIComponent(domain)}`,
  {
    method: "GET",
    headers: {
      // важный момент!
      Authorization: `Bearer ${token}`,
    },
  }
);

      if (!domRes.data.isAllowed) {
        throw new Error("Email-домен не разрешён для входа");
      }

      // 1.4. Шлём код подтверждения
      await sendValidationCode();

      // Переходим на шаг 2
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message);
      setPopState(true);
    }
  };

  // 2. Отправка кода подтверждения
  const sendValidationCode = async () => {
    const token = getCookie("access_token");
    await safeFetch(`${API}/send_validation_code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        // email: login,
        email: 'vitaliy.tiller@aeroclub.ru',
        // telegramAccount: "soplya11111111", 
        telegramAccount
      }),
    });
  };

  // 3. Подтверждение кода
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const token = getCookie("access_token");
      const validateRes = await safeFetch(`${API}/validate_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          validationCode,
          // telegramAccount: "soplya11111111",
          telegramAccount
        }),
      });

      // Успех! Обновим email по тому, что вернул сервер (если нужно)
      setCookie("user_email", validateRes.data.email, 7);
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message);
      setPopState(true);
    }
  };

  const renderPopup = () =>
    popState && (
      <div className="page_popup">
        <div className="auth_popup_container">
          <div className="auth_popup_wrapper">
            <img
              src={closeSquare}
              className="auth_popup_container_img"
              alt="close"
              onClick={() => setPopState(false)}
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
    );

  return (
    <div className="auth">
      {step === 1 && (
        <>
          <p className="title auth_title">Авторизация</p>
          <form className="auth_form" onSubmit={handleLoginSubmit}>
            <input
              type="text"
              placeholder="Логин (email)"
              className="input auth_input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              className="input auth_input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="submit"
              className="rbutton button auth_submit"
              value="Войти"
            />
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <p className="title auth_title">Проверочный код</p>
          <form className="auth_form" onSubmit={handleCodeSubmit}>
            <input
              type="text"
              placeholder="Код из письма"
              className="input auth_input"
              value={validationCode}
              onChange={(e) => setValidationCode(e.target.value)}
              required
            />
            <input
              type="submit"
              className="rbutton button auth_submit"
              value="Подтвердить"
            />
          </form>
        </>
      )}

      {renderPopup()}
    </div>
  );
}
