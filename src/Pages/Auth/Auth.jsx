import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import closeSquare from "../../assets/close-square.svg";
import "./Auth.scss";

export default function Auth() {
  const [popState, setPopState] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", login);
    formData.append("password", password);
    formData.append("grant_type", "password");
    formData.append("client_id", "SeatHub.Api");

    try {
      const response = await fetch("https://dev-passport.aeroclub.ru/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (data.access_token && data.refresh_token) {
        setCookie("access_token", data.access_token, 1);
        setCookie("refresh_token", data.refresh_token, 7);
         setCookie("user_email", login, 7);
        navigate("/");
      } else {
        setErrorMessage("Данные не верные");
        setPopState(true);
      }
    } catch (error) {
      setErrorMessage("Ошибка соединения с сервером.");
      setPopState(true);
    }
  };

  return (
    <div className="auth">
      <p className="title auth_title">Авторизация</p>
      <form className="auth_form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Логин"
          className="input auth_input"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          className="input auth_input"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="submit"
          className="rbutton button auth_submit"
          value="Войти"
        />
      </form>

      {popState && (
        <div className="page_popup">
          <div className="auth_popup_container">
            <div className="auth_popup_wrapper">
              <img
                src={closeSquare}
                className="auth_popup_container_img"
                alt=""
                onClick={() => setPopState(false)}
              />
              <p className="auth_popup_container_title">{errorMessage}</p>
              <p className="auth_popup_container_text">
               Повторите попытку или обратитесь в
              </p>

              <a href="https://myteam.aeroclub.ru/servicedesk/customer/portal/21/create/204" className="auth_popup_container_link">
                Service Desk 
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
