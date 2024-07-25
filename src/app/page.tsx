'use client';
import { useTelegram } from "contexts/telegram";

export default function Home() {
  const { telegram } = useTelegram();

  const handleClose = () => {
    telegram?.close();
  }

  return (<div>{telegram ? 'success':'fail'}<button onClick={handleClose}>close</button></div>);
}
