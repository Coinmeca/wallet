'use client';
import { useTelegram } from "contexts/telegram";
import { useState } from "react";

export default function Home() {
  const { telegram, show, expand, exit, bio } = useTelegram();
  const [authenticate, setAuthenticate] = useState<string | null>(null);
  const [requestAccess, setRequestAccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExpand = () => {
    expand();
  };

  const handleClose = () => {
    exit();
  };

  const handleShowConfirm = () => {
    show.confirm('showConfirm');
  };

  const handleShowPopup = () => {
    show.popup({
      title: 'showPopup',
      message: 'do something',
      buttons: [{ type: "close", text: "Close" }]
    });
  };

  const handleRequest = () => {
    if (telegram?.BiometricManager) {
      try {        
        // Request access with required params
        const accessResponse = bio.request('sign');
        setRequestAccess(JSON.stringify(accessResponse));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } else {
      setError("BiometricManager is not available.");
    }
  };

  const handleAuthenticate = () => {
    if (telegram?.BiometricManager) {
      try {        
        // Authenticate user with required params
        const authResponse = bio.auth('sign');
        setAuthenticate(JSON.stringify(authResponse));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } else {
      setError("BiometricManager is not available.");
    }
  };

  return (
    <div>
      <div>{telegram ? `Success, Platform: ${telegram.platform}` : 'Fail'}</div>
      <button onClick={handleExpand}>Expand</button>
      <button onClick={handleShowConfirm}>Show Confirm</button>
      <button onClick={handleShowPopup}>Show Popup</button>
      <button onClick={handleRequest}>Biometric Request</button>
      <button onClick={handleAuthenticate}>Biometric Auth</button>
      <button onClick={handleClose}>Close</button>
      {authenticate && `Authenticate: ${authenticate}`}<br />
      {requestAccess && `Request Access: ${requestAccess}`}<br />
      {error && `Error: ${error}`}<br />
    </div>
  );
}
