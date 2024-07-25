'use client';
import { useTelegram } from "contexts/telegram";

export default function Home() {
  const { telegram } = useTelegram();

  const handleExpand = () => {
    telegram?.expand();
  }

  const handleClose = () => {
    telegram?.close();
  }

  return (<div>{telegram ? 'success':'fail'}<button onClick={handleExpand}>expand</button><button onClick={handleClose}>close</button></div>);
}
