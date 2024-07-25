'use client';
import { useTelegram } from "contexts/telegram";

export default function Home() {
  const { telegram} = useTelegram();

  return (<div>{telegram ? 'success':'fail'}</div>);
}
