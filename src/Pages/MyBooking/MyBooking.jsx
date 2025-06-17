import React, { useState, useEffect, useMemo } from "react";
import "./MyBooking.scss";
import save_add from "../../assets/save-add.svg";
import sortIc from "../../assets/swap-vertical.svg";
import mycalendar from "../../assets/mycalendar.svg";
import trash from "../../assets/trash.svg";
import Loader from "../../Components/Loader/Loader";
import Calendar from "react-calendar";
import DeleteBooking from "../../Components/DeleteBooking/DeleteBooking";
import ShowImg from "../../Components/ShowImg/ShowImg";

export default function MyBooking({ refreshToken }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // null means "show all"
  const [tempDate, setTempDate] = useState(null);
  const [sortOption, setSortOption] = useState("date-asc");
  const [showDeletePopup, setShowDeletePopup] = useState(null);
    const [showSchemePopup, setShowSchemePopup] = useState(false);
  const [schemeImageUrl, setSchemeImageUrl] = useState("");
  const [schemeLocationName, setSchemeLocationName] = useState("");
  const [locationInfos, setLocationInfos] = useState([]);
  const getCookie = (name) => {
    const c = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return c ? c.split("=")[1] : null;
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    let token = getCookie("access_token") || (await refreshToken());
    if (!token) {
      console.error("Нет токена");
      setIsLoading(false);
      return;
    }

    const userEmail = getCookie("user_email") || "Vadim.Koshelev@aeroclub.ru";
    const params = new URLSearchParams({
      UserEmail: "Vadim.Koshelev@aeroclub.ru",
    });
    const resp = await fetch(
      `https://beta-seathub.aeroclub.ru/Booking/bookings?${params}`,
      {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (resp.status === 401) {
      token = await refreshToken();
      if (token) return fetchBookings();
    }
    if (!resp.ok) {
      console.error("Ошибка загрузки бронирований:", resp.status);
      setIsLoading(false);
      return;
    }

    const json = await resp.json();
    const list = (json?.data?.bookings || []).map((b) => ({
      id: b.id,
      rawDate: new Date(b.date),
      date: new Date(b.date).toLocaleDateString("ru-RU"),
      placeId: b.locationPlace.id,
      locationId: b.locationPlace.location.id,
      number: b.locationPlace.name,
      location: b.locationPlace.location.name,
    }));
    setBookings(list);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Сохраняем все даты для календаря
  const bookedDatesSet = useMemo(() => {
    const s = new Set(bookings.map((b) => b.rawDate.toDateString()));
    return s;
  }, [bookings]);

  // Показываем только брони на выбранную дату, если дата выбрана
  const filteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    return bookings.filter(
      (b) => b.rawDate.toDateString() === selectedDate.toDateString()
    );
  }, [bookings, selectedDate]);

  // Сортировка
  const sortedBookings = useMemo(() => {
    const arr = [...filteredBookings];
    const [field, order] = sortOption.split("-");
    arr.sort((a, b) => {
      let v1, v2;
      switch (field) {
        case "date":
          v1 = a.rawDate;
          v2 = b.rawDate;
          break;
        case "place":
          v1 = a.placeId;
          v2 = b.placeId;
          break;
        case "location":
          v1 = a.locationId;
          v2 = b.locationId;
          break;
        default:
          return 0;
      }
      if (v1 < v2) return order === "asc" ? -1 : 1;
      if (v1 > v2) return order === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredBookings, sortOption]);



  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleResetDate = () => setSelectedDate(null);
const fetchLocationInfos = async () => {
    let token = getCookie("access_token") || (await refreshToken());
    if (!token) return;
    const resp = await fetch("https://beta-seathub.aeroclub.ru/Booking/location_infos", {
      headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
    });
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
    fetchBookings();
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
    <div className="mybook">
 {showSchemePopup && (
        <ShowImg
          imageUrl={schemeImageUrl}
          locationName={schemeLocationName}
          closeScheme={handleCloseScheme}
        />
      )}
      {/* <ShowImg imageUrl={'../../assets/flag.svg'}/> */}
      {!isLoading && bookings.length > 0 ? (
        <>
          <a href="/tobook" className="button rbutton mybook_rbutton">
            <img src={save_add} className="mybook_rbutton_img" alt="" />
            Забронировать место
          </a>
          <p className="title mybook_title">Мои бронирования</p>

          <div className="mybook_container_top">
            <div className="mybook_container_sort">
              {/* <img src={sortIc} className="mybook_container_sort_img" alt="" />
              <select
                className="mybook_select"
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="date-asc">По дате ↑</option>
                <option value="date-desc">По дате ↓</option>
                <option value="place-asc">По номеру места ↑</option>
                <option value="place-desc">По номеру места ↓</option>
                <option value="location-asc">По локации ↑</option>
                <option value="location-desc">По локации ↓</option>
              </select> */}
            </div>
            {selectedDate && (
              <button
                className="button mybook_reset_date_button"
                onClick={handleResetDate}
              >
                Показать все даты
              </button>
            )}
            <div
              className="mybook_container_calendar"
              onClick={() => setIsCalendarOpen(true)}
            >
              <img src={mycalendar} alt="" />
            </div>
          </div>

          <div className="mybook_wrapper">
            {sortedBookings.length > 0 ? (
              sortedBookings.map((item) => (
                <div key={item.id} className="mybook_wrapper_item">
                  <div className="mybook_wrapper_item_top">
                    <div className="mybook_wrapper_item_top_item">
                      <p className="mybook_wrapper_item_top_title">Дата</p>
                      <p className="mybook_wrapper_item_top_value">
                        {item.date}
                      </p>
                    </div>
                    <div className="mybook_wrapper_item_top_item">
                      <p className="mybook_wrapper_item_top_title">№ места</p>
                      <p className="mybook_wrapper_item_top_value">
                        {item.number}
                      </p>
                    </div>
                  </div>
                  <div className="mybook_wrapper_item_top_item">
                    <p className="mybook_wrapper_item_top_title">Локация</p>
                    <p className="mybook_wrapper_item_top_value">
                      {item.location}
                    </p>
                  </div>
                  <div className="mybook_buttons_wrapper">
                    {/* <div className="mybook_button_trash" onClick={() => handleDelete(item.id)}>
                    <img src={trash} alt="Удалить" />
                  </div> */}
                    <div
                      className="mybook_button_trash"
                      onClick={() => setShowDeletePopup(item.id)}
                    >
                      <img src={trash} alt="Удалить" />
                    </div>
                    <button className="button mybook_scheme_button"  onClick={() => handleShowScheme(item.locationId, item.location)}>
                      Схема мест
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="mybook_zero">
                <p className="mybook_zero_text">
                  Нет бронирований на выбранную дату
                </p>
                <button
                  className="button mybook_reset_date_button"
                  onClick={handleResetDate}
                >
                  Показать все даты
                </button>
              </div>
            )}
          </div>

          {isCalendarOpen && (
            <div className="page_popup page_popup_tobook">
              <div className="booking-container">
                <Calendar
                  onChange={setTempDate}
                  value={tempDate || selectedDate || new Date()}
                  tileClassName={({ date, view }) =>
                    view === "month" && bookedDatesSet.has(date.toDateString())
                      ? "booked-date"
                      : null
                  }
                />
                <div className="tobook_date_buttons_wrapper">
                  <button
                    className="button rbutton tobook_pick_date_button"
                    onClick={() => {
                      setSelectedDate(tempDate);
                      setIsCalendarOpen(false);
                      setTempDate(null);
                    }}
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
        </>
      ) : !isLoading && bookings.length === 0 ? (
        <div className="mybook_zero">
          <p className="title mybook_title">Мои бронирования</p>
          <div className="mybook_zero_container">
            <p className="mybook_zero_text">
              У вас пока нет активных бронирований
            </p>
            <a href="/tobook" className="button rbutton mybook_rbutton">
              <img src={save_add} className="mybook_rbutton_img" alt="" />
              Забронировать место
            </a>
          </div>
        </div>
      ) : (
        <Loader isFull={true} />
      )}
      {showDeletePopup && (
        <DeleteBooking
          setShowDeletePopup={setShowDeletePopup}
          showDeletePopup ={showDeletePopup}
          getCookie={getCookie}
          refreshToken={refreshToken}
          setBookings={setBookings}
        />
      )}
    </div>
  );
}
