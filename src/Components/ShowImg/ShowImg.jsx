import React, { useState } from "react";
import image from "../../assets/cross.svg";
import Loader from "../Loader/Loader";
import "./ShowImg.scss";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

export default function ShowImg({ imageUrl, closeScheme, locationName }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="page_popup page_popup_img_show page_popup_tobook">
      {loading && <Loader isFull={true} />}
      <div className="booking-container page_popup_rooms success_popup_container showImg">
        <img src={image} onClick={closeScheme} alt="Закрыть" />

        <p className="loc">Локация</p>
        <p className="">{locationName}</p>
<div className="img-wrapper">
  {imageUrl ? (
    

<TransformWrapper>
  <TransformComponent>
    <img
      src={imageUrl}
      alt={locationName}
      className="imgscheme"
      onLoad={() => setLoading(false)}
    />
      </TransformComponent>
</TransformWrapper>
  ) : (
    <p>Изображение недоступно</p>
  )}
</div>

      </div>
    </div>
  );
}
