'use client';
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any>(typeof window !== 'undefined' && (window as any)?.Telegram?.WebApp);
  
  useEffect(() => {
    if (typeof window !== 'undefined') setData((window as any)?.Telegram?.WebApp)
  }, [])

  return (<div>{data || 'not setup'}</div>);
}
