'use client';
import { useTelegram } from "contexts/telegram";
import { platform } from "os";
import { useState } from "react";

export default function Home() {
  const { telegram } = useTelegram();
  const [authenticate, setAuthenticate] = useState<any>();
  const [requestAccess, setRequestAccess] = useState<any>();
  const [error, setError] = useState<any>('');

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

  const handleAuthenticate = async () => {
    try {
      const requestAccess = await telegram?.BiometricManager?.requestAccess();
      if(requestAccess)setRequestAccess(JSON.stringify(requestAccess));

      const authenticate = await telegram?.BiometricManager?.authenticate();
      if (authenticate) setAuthenticate(JSON.stringify(authenticate));

    } catch (error) {
      setError(error?.toString())
    }
  }

  return (<div>
      <div>{telegram ? `success, Platform:${telegram?.platform}` : 'fail'}</div>
      <button onClick={handleExpand}>expand</button>
      <button onClick={handleShowConfirm}>showConfirm</button>
      <button onClick={handleShowPopup}>showPopup</button>
      <button onClick={handleAuthenticate}>BiometricManager</button>
    <button onClick={handleClose}>close</button>
    {authenticate !== "" && `authenticate: ${authenticate}`}
    {requestAccess !== "" && `requestAccess: ${requestAccess}`}
    {error !== "" && `Error: ${error}`}
    </div>);
}
