import React, { useState, useEffect } from "react";
import "./Booking.scss";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import calendarSvg from "../../assets/calendar.svg";
import flag from "../../assets/flag.svg";
import BookedSucces from "../../Components/BookedSucces/BookedSucces";
import BookingFields from "../../Components/BookingFields/BookingFields";
import Loader from "../../Components/Loader/Loader";
import ShowError from "../../Components/ShowError/ShowError";

export default function Booking({ refreshToken }) {
  // --- состояние ---
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempDate, setTempDate] = useState(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [locationList, setLocationList] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [isRoomPopupOpen, setIsRoomPopupOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formattedRoom, setFormattedRoom] = useState("");

  const [showBookingFields, setShowBookingFields] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      window.location.href = "/";
    });
    return () => {
      tg.BackButton.offClick(() => {});
      tg.BackButton.hide();
    };
  }, []);

  const getCookie = (name) => {
    const c = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return c ? c.split("=")[1] : null;
  };

  const fetchLocations = async () => {
    let token = getCookie("access_token") || (await refreshToken());
    if (!token) return console.error("Нет токена");

    const resp = await fetch(
      "https://beta-seathub.aeroclub.ru/Booking/locations",
      {
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      }
    );
    if (resp.status === 401) {
      token = await refreshToken();
      if (token) return fetchLocations();
    }
    if (!resp.ok) throw new Error(resp.status);

    const json = await resp.json();
    const locations = json?.data?.locations ?? [];
    setLocationList(Array.isArray(locations) ? locations : []);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleConfirmDate = () => {
    if (tempDate) {
      const correctedDate = new Date(tempDate);
      correctedDate.setHours(13, 0, 0, 0); // Устанавливаем час дня

      setSelectedDate(correctedDate);
      console.log(correctedDate); // Теперь в консоли будет корректное значение

      setFormattedDate(
        correctedDate.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );

      setTempDate(null);
      setIsCalendarOpen(false);
      setFormattedRoom("");
      setSelectedRoom(null);
    }
  };

  // --- выбор локации ---
  const handleLocationSelection = (loc) => {
    setSelectedLocation(loc);
    setFormattedRoom("");
    setSelectedRoom(null);
  };

  // --- загрузка комнат ---
  const fetchRooms = async (locationId, dateIso) => {
    setLoading(true);

    setIsRoomsLoading(true);
    let token = getCookie("access_token") || (await refreshToken());
    if (!token) {
      console.error("Нет токена");
      setIsRoomsLoading(false);
      return;
    }
    const userEmail = getCookie("user_email");
    const params = new URLSearchParams({
      // UserEmail: userEmail,
      UserEmail: "Vadim.Koshelev@aeroclub.ru",
      LocationId: locationId,
      Date: dateIso,
    });
    const resp = await fetch(
      `https://beta-seathub.aeroclub.ru/Booking/location_places?${params}`,
      {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (resp.status === 401) {
      token = await refreshToken();
      if (token) return fetchRooms(locationId, dateIso);
    }
    if (!resp.ok) throw new Error(resp.status);

    const json = await resp.json();
    const places = json?.data?.locationPlaces ?? [];
    const mapped = places.map((p) => ({
      placeId: p.id,
      num: p.name,
      isBusy: p.status !== "free",
    }));
    setRooms(mapped);
    setIsRoomsLoading(false);
    setLoading(false);
  };

  const openRoomPopup = () => {
    if (!selectedLocation) {
      setErrorText("Сначала выберите локацию");
      setShowErrorPopup(true);
      return;
    }
    if (!selectedDate) {
      setErrorText("Сначала выберите дату");
      setShowErrorPopup(true);
      return;
    }
    const dateIso = selectedDate.toISOString().split("T")[0];
    fetchRooms(selectedLocation.id, dateIso).then(() => {
      setSelectedRoom(null);
      setIsRoomPopupOpen(true);
    });
  };

  const handleConfirmRoom = () => {
    if (selectedRoom != null) {
      setFormattedRoom(selectedRoom.num);
      setIsRoomPopupOpen(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedLocation || !selectedRoom) {
      setShowBookingFields(true);
      return;
    }

    const userEmail = getCookie("user_email");
    const body = {
      userEmail: "Vadim.Koshelev@aeroclub.ru",
      locationPlaceId: selectedRoom.placeId,
      date: selectedDate.toISOString(),
      deleteExistedBooking: false,
    };

    console.log(selectedDate.toISOString().split("T")[0]);

    let token = getCookie("access_token") || (await refreshToken());
    if (!token) return console.error("Нет токена");

    try {
      setLoading(true);
      const resp = await fetch(
        "https://beta-seathub.aeroclub.ru/Booking/book",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (resp.status === 401) {
        token = await refreshToken();
        if (token) return handleBooking();
      }

      const text = await resp.text();

      if (!resp.ok) {
        console.error("Ошибка от сервера:", resp.status, text);

        try {
          const errorData = JSON.parse(text);
          console.log(errorData.errorCode);
          if (errorData.errorCode === 3001) {
            console.log("ppp");
            setErrorText(
              errorData.error + " Пожалуйста, выберите другую дату."
            ); // Передаем текст ошибки
            setShowErrorPopup(true); // Показываем всплывающее окно
          }
        } catch (parseError) {
          console.error("Ошибка парсинга ответа:", parseError);
        }

        throw new Error(`Status ${resp.status}`);
      }

      setShowSuccess(true);
    } catch (e) {
      console.error("Ошибка бронирования:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tobook">
      {loading && <Loader isFull={true} />}
      <p className="title tobook_title">Забронировать место</p>
      <div className="tobook_wrapper">
        {/* Локации */}
        <div className="tobook_locations">
          <p className="tobook_locations_prev">Локации</p>
          <div className="tobook_locations_wrapper">
            <div className="tobook_locations_wrapper_inner">

            {locationList.length > 0 ? (
              locationList.map((loc) => (
                <div
                  key={loc.id}
                  className={`tobook_location_item ${
                    !loc.isDisabled ? "active" : ""
                  } ${
                    selectedLocation?.id === loc.id ? "location_chosen" : ""
                  }`}
                  onClick={() =>
                    !loc.isDisabled && handleLocationSelection(loc)
                  }
                >
                  {loc.name}
                </div>
              ))
            ) : (
              <Loader isFull={false} />
            )}
            </div>

          </div>
        </div>

        <div
          className="tobook_input_outer"
          onClick={() => setIsCalendarOpen(true)}
        >
          <input
            type="text"
            placeholder="Дата"
            className="input tobook_input_date"
            value={formattedDate}
            readOnly
          />
          <img src={calendarSvg} className="tobook_input_date_img" alt="" />
        </div>

        <div className="tobook_input_outer" onClick={openRoomPopup}>
          <input
            type="text"
            placeholder="Номер места"
            className="input tobook_input_date"
            value={formattedRoom}
            readOnly
          />
          <img src={flag} className="tobook_input_date_img" alt="" />
        </div>

        <button onClick={handleBooking} className="button rbutton">
          Забронировать
        </button>
        {/* Попап календаря */}
        {isCalendarOpen && (
          <div className="page_popup page_popup_tobook">
            <div className="booking-container">
              <Calendar
                onChange={setTempDate}
                value={tempDate || selectedDate}
                minDate={new Date()}
                tileDisabled={({ date }) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                tileClassName={({ date, view }) => {
                  if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
                    return "calendar-tile-disabled";
                  }
                }}
              />

              <div className="tobook_date_buttons_wrapper">
                <button
                  className="button rbutton tobook_pick_date_button"
                  onClick={handleConfirmDate}
                >
                  Выбрать
                </button>
                <button
                  className="button tobook_decline_date_button"
                  onClick={() => {
                    setIsCalendarOpen(false);
                    setTempDate(null);
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Попап комнат */}
        {isRoomPopupOpen && (
          <div className="page_popup page_popup_tobook">
            <div className="booking-container page_popup_rooms">
              <p className="page_popup_rooms_title">Номер места</p>
              <div className="page_popup_rooms_wrapper">
                {isRoomsLoading ? (
                  <Loader />
                ) : (
                  rooms.map((r, i) => (
                    <div
                      key={i}
                      className={`page_popup_rooms_item ${
                        r.isBusy ? "" : "active"
                      } ${
                        selectedRoom?.placeId === r.placeId ? "choice_room" : ""
                      }`}
                      onClick={() => !r.isBusy && setSelectedRoom(r)}
                    >
                      {r.num}
                    </div>
                  ))
                )}
              </div>
              <div className="tobook_date_buttons_wrapper">
                <button
                  className="button rbutton tobook_pick_date_button"
                  onClick={handleConfirmRoom}
                >
                  Выбрать
                </button>
                <button
                  className="button tobook_decline_date_button"
                  onClick={() => setIsRoomPopupOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Fields */}
        {showSuccess && <BookedSucces setShowSuccess={setShowSuccess} />}
        {showBookingFields && (
          <BookingFields setShowBookingFields={setShowBookingFields} />
        )}
        {showErrorPopup && (
          <ShowError
            errorText={errorText}
            setShowErrorPopup={setShowErrorPopup}
          />
        )}
      </div>
    </div>
  );
}
