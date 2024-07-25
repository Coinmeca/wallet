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

  return (<div>{telegram ? `success, Platform:${telegram?.platform}` : 'fail'}<button onClick={handleExpand}>expand</button><button onClick={handleClose}>close</button></div>);
}
