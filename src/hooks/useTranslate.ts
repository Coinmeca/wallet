"use client";
import { GetLanguage } from 'api/language';
import { useEffect } from 'react';
import { create } from 'zustand';

const schema = 1;
const key = 'coinmeca:wallet:language';
const legacy = 'languageCode';

const readLanguageCode = () => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const value = localStorage.getItem(key);
    if (value) {
        try {
            const data = JSON.parse(value);
            if (data && typeof data === 'object' && data.schema === schema && typeof data.code === 'string' && data.code.trim() !== '') {
                return { code: data.code, legacy: false };
            }
        } catch {}
    }

    const fallback = localStorage.getItem(legacy);
    if (fallback && fallback.trim() !== '') return { code: fallback, legacy: true };
};

const writeLanguageCode = (code: string) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(key, JSON.stringify({ schema, code }));
    localStorage.setItem(legacy, code);
};

const useTranslateStore = create<object>((set: any) => ({
    code: undefined,
    setLanguage: (data: object) => set(() => ({ ...data })),
    setLanguageCode: (code: string) => set(() => ({ code })),
}));

interface Interpolation {
    [x: number | string | symbol]: string;
}

export function useTranslate() {
    const t: any = useTranslateStore();
    const { data: language } = GetLanguage(t?.code || 'en');

    useEffect(() => {
        const data = readLanguageCode();
        if (data?.legacy) writeLanguageCode(data.code);
        if (data?.code) t?.setLanguageCode(data.code || navigator?.language || t?.code);
    }, []);

    useEffect(() => {
        t?.setLanguage(language);
    }, [language]);

    return {
        t: (key: string, interpolation?: Interpolation): string => {
            let result = (t as any)[key];
            if (result) {
                if (interpolation && Object.keys(interpolation)?.length > 0) {
                    for (const word in interpolation) {
                        if (result?.includes(`{{${word}}}`)) result = result?.replaceAll(`{{${word}}}`, interpolation[word]);
                    }
                }
                return result;
            }
            return '';
        },
        languageCode: t?.code || 'en',
        setLanguage: t?.setLanguage,
        setLanguageCode: (code: string) => {
            writeLanguageCode(code);
            return t?.setLanguageCode(code);
        },
    };
};
