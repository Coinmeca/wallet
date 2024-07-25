'use client';
import { useTelegram } from "contexts/telegram";
import { platform } from "os";

export default function Home() {
  const { telegram } = useTelegram();

  const handleExpand = () => {
    telegram?.expand();
  }

  const handleClose = () => {
    telegram?.close();
  }

  const handleShowConfirm = () => {
    telegram?.showConfirm('showConfirm');
  }

  const handleShowPopup = () => {
    telegram?.showPopup({ title: 'showPopup', message: 'do something', buttons:[[{type:"close"}]]} );
  }

  const handleAuthenticate = () => {
    telegram?.authenticate();
  }

  return (<div>
      <div>{telegram ? `success, Platform:${telegram?.platform}` : 'fail'}</div>
      <button onClick={handleExpand}>expand</button>
      <button onClick={handleShowConfirm}>showConfirm</button>
      <button onClick={handleShowPopup}>showPopup</button>
      <button onClick={handleAuthenticate}>BiometricManager</button>
      <button onClick={handleClose}>close</button>
    </div>);
}
