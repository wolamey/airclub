import React from "react";
import "./BookedSucces.scss";
export default function BookedSucces({setShowSuccess}) {
  return (
    <div className="page_popup page_popup_tobook">
      <div className="booking-container page_popup_rooms success_popup_container">
        <p className="success_popup_container_title">
          Ваше бронирование оформлено
        </p>
        <p className="auth_popup_container_text">
          и занесено в список бронирований
        </p>
        <a href="/" className="rbutton button success_button">Отлично</a>
      </div>
    </div>
  );
}
