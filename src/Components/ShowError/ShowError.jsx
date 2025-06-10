import React from "react";
import "./ShowError.scss";
export default function ShowError({errorText, setShowErrorPopup}) {
  return (
    <div className="page_popup page_popup_tobook">
      <div className="booking-container page_popup_rooms success_popup_container">
        <p className="success_popup_container_title success_popup_container_title2">
        {errorText}
        </p>
      
        <button onClick={()=>setShowErrorPopup(false)} className=" button success_button booking_fields_button">Хорошо</button>
      </div>
    </div>
  );
}
