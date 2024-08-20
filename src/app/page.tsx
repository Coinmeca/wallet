'use client';
import { useTelegram } from "contexts/telegram";
import { useState } from "react";

export default function Home() {
  const { telegram } = useTelegram();
  const [authenticate, setAuthenticate] = useState<string | null>(null);
  const [requestAccess, setRequestAccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExpand = () => {
    telegram?.expand();
  };

  const handleClose = () => {
    telegram?.close();
  };

  const handleShowConfirm = () => {
    telegram?.showConfirm('showConfirm');
  };

  const handleShowPopup = () => {
    telegram?.showPopup({
      title: 'showPopup',
      message: 'do something',
      buttons: [{ type: "close", text: "Close" }]
    });
  };

  const handleAuthenticate = async () => {
    if (telegram?.BiometricManager) {
      try {
        // Initialize BiometricManager
        await telegram.BiometricManager.init();
        
        // Request access with required params
        const accessParams: BiometricRequestAccessParams = {reason:'sign'};
        const accessResponse = await telegram.BiometricManager.requestAccess(accessParams);
        setRequestAccess(JSON.stringify(accessResponse));
        
        // Authenticate user with required params
        const authParams: BiometricAuthenticateParams = {reason:'sign'};
        const authResponse = await telegram.BiometricManager.authenticate(authParams);
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
      <button onClick={handleAuthenticate}>Biometric Manager</button>
      <button onClick={handleClose}>Close</button>
      {authenticate && `Authenticate: ${authenticate}`}<br />
      {requestAccess && `Request Access: ${requestAccess}`}<br />
      {error && `Error: ${error}`}<br />
    </div>
  );
}
