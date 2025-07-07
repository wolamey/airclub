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
import ShowImg from "../../Components/ShowImg/ShowImg";

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
  const [schemeImageUrl, setSchemeImageUrl] = useState("");
  const [schemeLocationName, setSchemeLocationName] = useState("");
  const [locationInfos, setLocationInfos] = useState([]);
  const [showSchemePopup, setShowSchemePopup] = useState(false);
  const [isAllbusy, setIsAllbusy] = useState(false);
  const [isAllmine, setIsAllmine] = useState(false);
  const [previewData, setPreviewData] = useState({ id: null, name: "" });

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
    console.log(locations);
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

  useEffect(() => {
    if (selectedDate && selectedLocation && isCalendarOpen === false) {
      openRoomPopup();
    }
  }, [selectedDate]);

  // --- выбор локации ---
  const handleLocationSelection = (loc) => {
    setSelectedLocation(loc);
    setFormattedRoom("");
    setSelectedRoom(null);
  };


  const handleApiError = (errorObj, setErrorText, setShowErrorPopup) => {
  if (errorObj?.errorCode === 2002 && errorObj?.error?.includes("заблокирован")) {
    setErrorText(errorObj.error);
    setShowErrorPopup(true);
    return true; // ошибка обработана
  }
  return false; // не обработана
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
    // UserEmail: 'zhukov@aeroclub.ru', 
    UserEmail: userEmail, 
    LocationId: locationId,
    Date: dateIso,
  });

  try {
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

    const json = await resp.json();

    // 👉 Обработка ошибок от сервера с текстом
    if (!resp.ok || json?.errorCode) {
      if (handleApiError(json, setErrorText, setShowErrorPopup)) {
        setIsRoomsLoading(true);
        setLoading(false);
      setIsRoomPopupOpen(false);
        return;
      }
      throw new Error(`Ошибка: ${resp.status}`);
    }

    const places = json?.data?.locationPlaces ?? [];
    const mapped = places.map((p) => ({
      placeId: p.id,
      num: p.name,
      isBusy: p.status,
    }));

    setRooms(mapped);
    setIsRoomsLoading(false);
    setLoading(false);

    const allBusy = mapped.every((room) => room.isBusy !== "free");
    setIsAllbusy(allBusy);

    const hasMine = mapped.some((room) => room.isBusy === "occupiedByUser");
    setIsAllmine(hasMine);

    console.log(mapped);
  } catch (err) {
    console.error("Ошибка при загрузке комнат:", err);
    if (!showErrorPopup) {
      setErrorText("Произошла ошибка при загрузке комнат.");
      setShowErrorPopup(true);
    }
    setIsRoomsLoading(false);
    setLoading(false);
  }
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
    userEmail: userEmail,
        // userEmail: 'zhukov@aeroclub.ru', 

    locationPlaceId: selectedRoom.placeId,
    date: selectedDate.toISOString(),
    deleteExistedBooking: false,
  };

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

        // ✅ Универсальная обработка ошибок
        if (handleApiError(errorData, setErrorText, setShowErrorPopup)) {
          return;
        }

        // 👇 Пример специфической обработки, если нужно оставить
        if (errorData.errorCode === 3001) {
          setErrorText(errorData.error + " Пожалуйста, выберите другую дату.");
          setShowErrorPopup(true);
          return;
        }
      } catch (parseError) {
        console.error("Ошибка парсинга ответа:", parseError);
      }

      throw new Error(`Status ${resp.status}`);
    }

    setShowSuccess(true);
  } catch (e) {
    console.error("Ошибка бронирования:", e);
    if (!showErrorPopup) {
      setErrorText("Произошла ошибка при бронировании.");
      setShowErrorPopup(true);
    }
  } finally {
    setLoading(false);
  }
};


  const fetchLocationInfos = async () => {
    let token = getCookie("access_token") || (await refreshToken());
    if (!token) return;
    const resp = await fetch(
      "https://beta-seathub.aeroclub.ru/Booking/location_infos",
      {
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
      }
    );
    if (resp.status === 401) {
      token = await refreshToken();
      if (token) return fetchLocationInfos();
    }
    if (resp.ok) {
      const json = await resp.json();
      setLocationInfos(json.data.locationInfos);
    }
  };

  useEffect(() => {
    fetchLocationInfos();
  }, []);

  const handleShowScheme = (locId, locName) => {
    const info = locationInfos.find((li) => li.locationId === locId);
    setSchemeImageUrl(info?.imageUrl || "");
    setSchemeLocationName(locName);
    setShowSchemePopup(true);
  };

  const handleCloseScheme = () => {
    setShowSchemePopup(false);
    setSchemeImageUrl("");
    setSchemeLocationName("");
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
                    onClick={() => {
                      setPreviewData({ id: loc.id, name: loc.name });
                      !loc.isDisabled && handleLocationSelection(loc);
                    }}
                  >
                    {loc.name}
                  </div>
                ))
              ) : (
                <Loader isFull={false} />
              )}
            </div>
          </div>
          {previewData.id && (
            <button
              className="button gbutton preview_button"
              onClick={() => {
                handleShowScheme(previewData.id, previewData.name);
              }}
            >
              Предпросмотр схемы
            </button>
          )}
        </div>
        {showSchemePopup && (
          <ShowImg
            imageUrl={schemeImageUrl}
            locationName={schemeLocationName}
            closeScheme={handleCloseScheme}
          />
        )}
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
                        r.isBusy === "occupied"
                          ? "occupied"
                          : r.isBusy === "occupiedByUser"
                          ? "occupiedByUser"
                          : "active"
                      } ${
                        selectedRoom?.placeId === r.placeId ? "choice_room" : ""
                      }`}
                      onClick={() => r.isBusy === "free" && setSelectedRoom(r)}
                    >
                      {r.num}
                    </div>
                  ))
                )}
              </div>
              <div className="tobook_date_buttons_wrapper">
                {isAllbusy ? (
                  <p>Свободных мест нет</p>
                ) : isAllmine ? (
                  <p>Уже есть бронь на эту дату</p>
                ) : (
                  <button
                    className="button rbutton tobook_pick_date_button"
                    onClick={handleConfirmRoom}
                  >
                    Выбрать
                  </button>
                )}

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
