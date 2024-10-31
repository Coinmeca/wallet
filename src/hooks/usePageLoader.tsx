import { useEffect, useState } from "react";

export function usePageLoader() {
    const [isLoad, setIsLoad] = useState(false);

    useEffect(() => {
        setIsLoad(true);
        return () => setIsLoad(false);
    }, []);

    return { isLoad };
}
