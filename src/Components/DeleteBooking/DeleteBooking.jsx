import React, { useState } from "react";
import "./DeleteBooking.scss";
import Loader from "../Loader/Loader";
export default function DeleteBooking({
  setShowDeletePopup,
  showDeletePopup,
  getCookie,
  refreshToken,
  setBookings,
}) {
  const [loading, setLoading] =useState(false)
  const handleDelete = async (id) => {
    setLoading(true)
    const userEmail = getCookie("user_email") || "Vadim.Koshelev@aeroclub.ru";
    const params = new URLSearchParams({
      BookingId: id,
      UserEmail: userEmail,
    });
    const token = getCookie("access_token") || (await refreshToken());
    const resp = await fetch(
      `https://beta-seathub.aeroclub.ru/Booking?${params}`,
      {
        method: "DELETE",
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      }
    );
    if (resp.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } else {
      console.error("Ошибка удаления:", resp.status);
      
    }
    setLoading(false)
setShowDeletePopup(false)
  };
  return (
    <div className="page_popup page_popup_tobook">

      {loading && (
                <Loader isFull={true} />
        
      )}
      <div className="booking-container page_popup_rooms success_popup_container">
        <p className="success_popup_container_title success_popup_container_title2">
          Отменить бронирование?
        </p>

        <button
          onClick={() => handleDelete(showDeletePopup)}
          className=" button rbutton success_button "
        >
          Отменить
        </button>
        <button
          onClick={() => setShowDeletePopup(false)}
          className=" button button_left  success_button "
        >
          Оставить
        </button>
      </div>
    </div>
  );
}
