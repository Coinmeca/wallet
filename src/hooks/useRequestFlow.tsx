"use client";

import { useEffect, useRef, useState } from "react";

import { useMessageHandler } from "contexts/message";
import { useRequest } from "./useRequest";

interface RequestFlowOptions {
    method: string;
    timeout?: number;
    rejectOnClose?: string;
    onReset?: () => void;
}

export function useRequestFlow({ method, timeout = 5000, rejectOnClose = "User rejected the request", onReset }: RequestFlowOptions) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const settledRef = useRef(false);
    const onResetRef = useRef(onReset);

    const { success, failure, next, count, close } = useMessageHandler();
    const { load, id, setId, request } = useRequest(method);

    const [level, setLevel] = useState(0);
    const [error, setError] = useState<any>();

    const resolve = (result: any) => {
        if (settledRef.current) return false;
        settledRef.current = true;
        success(id, result);
        return true;
    };

    const reject = (reason: any) => {
        if (settledRef.current) return false;
        settledRef.current = true;
        failure(id, reason);
        return true;
    };

    const handleClose = () => {
        if (!settledRef.current) reject(rejectOnClose);
        close(id);
    };

    const closeRequest = () => {
        close(id);
    };

    const handleNext = () => {
        setId(next(id) || "");
    };

    const scheduleClose = (callback: () => void = handleClose, delay = timeout) => {
        if (!count) timeoutRef.current = setTimeout(callback, delay);
    };

    onResetRef.current = onReset;

    useEffect(() => {
        if (count && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [count]);

    useEffect(() => {
        if (id && id !== "") {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            settledRef.current = false;
            setError(undefined);
            setLevel(0);
            onResetRef.current?.();
        }
    }, [id]);

    return {
        load,
        id,
        setId,
        request,
        next,
        count,
        level,
        setLevel,
        error,
        setError,
        resolve,
        reject,
        handleClose,
        closeRequest,
        handleNext,
        scheduleClose,
        settledRef,
    };
}
