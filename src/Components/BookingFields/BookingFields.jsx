import React from "react";
import "./BookingFields.scss";
export default function BookingFields({setShowBookingFields}) {
  return (
    <div className="page_popup page_popup_tobook">
      <div className="booking-container page_popup_rooms success_popup_container">
        <p className="success_popup_container_title">
         Вы не заполнили обязательные поля
        </p>
        <p className="auth_popup_container_text">
        Проверьте и попробуйте снова
        </p>
        <button onClick={()=>setShowBookingFields(false)} className=" button success_button booking_fields_button">Хорошо</button>
      </div>
    </div>
  );
}
