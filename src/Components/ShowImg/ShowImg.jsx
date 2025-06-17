import React, { useState } from "react";
import image from "../../assets/cross.svg";
import Loader from "../Loader/Loader";
import './ShowImg.scss'

export default function ShowImg({ imageUrl, closeScheme, locationName }) {
  const [loading, setLoading] = useState(false);

  return (
   <div className="page_popup page_popup_tobook">
      {loading && <Loader isFull={true} />}
      <div className="booking-container page_popup_rooms success_popup_container showImg">
        {/* Close button should receive the handler, not call immediately */}
        <img src={image} onClick={closeScheme} alt="Закрыть" />

        <p className="loc">Локация</p>
        <p className="">{locationName}</p>

        {imageUrl ? <img src={imageUrl} alt={locationName} className="imgscheme"/> : <p>Изображение недоступно</p>}
      </div>
    </div>
  );
}
