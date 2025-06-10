import React from "react";
import "./Loader.scss";
export default function Loader({isFull}) {
  return (
    <div className={isFull ? "loader big" : "loader "}>
      <div className="dot-collision"></div>
    </div>
  );
}
