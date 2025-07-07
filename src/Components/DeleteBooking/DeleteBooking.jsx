import React, { useState } from "react";
import "./DeleteBooking.scss";
import Loader from "../Loader/Loader";
import ShowError from "../ShowError/ShowError";
export default function DeleteBooking({
  setShowDeletePopup,
  showDeletePopup,
  getCookie,
  refreshToken,
  setBookings,
}) {
  const [errorText, setErrorText] = useState("");
const [showErrorPopup, setShowErrorPopup] = useState(false);
const handleApiError = (responseJson, setErrorText, setShowErrorPopup) => {
  if (responseJson?.errorCode && responseJson?.error) {
    setErrorText(responseJson.error);
    setShowErrorPopup(true);
    return true;
  }
  return false;
};

  const [loading, setLoading] =useState(false)
const handleDelete = async (id) => {
  setLoading(true);
  const userEmail = getCookie("user_email");
  const params = new URLSearchParams({
    BookingId: id,
        // UserEmail: 'zhukov@aeroclub.ru', 
    UserEmail: userEmail,
  });
  const token = getCookie("access_token") || (await refreshToken());

  try {
    const resp = await fetch(
      `https://beta-seathub.aeroclub.ru/Booking?${params}`,
      {
        method: "DELETE",
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      }
    );

    const json = await resp.json();

    if (!resp.ok || json?.errorCode) {
      if (handleApiError(json, setErrorText, setShowErrorPopup)) {
        setLoading(false);
        return;
      }
      throw new Error(`Ошибка: ${resp.status}`);
    }

    setBookings((prev) => prev.filter((b) => b.id !== id));
    setShowDeletePopup(false);
  } catch (err) {
    console.error("Ошибка удаления:", err);
    if (!showErrorPopup) {
      setErrorText("Произошла ошибка при удалении бронирования.");
      setShowErrorPopup(true);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page_popup page_popup_tobook">
{showErrorPopup && (
  <ShowError
    errorText={errorText}
    setShowErrorPopup={setShowErrorPopup}
  />
)}
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
