import Image from "next/image";

export default function Home() {
  return (<div>{typeof window !== 'undefined' && ((window as any)?.Telegram?.WebApp) ? JSON.stringify((window as any)?.Telegram?.WebApp): 'not setup'}</div>);
}
