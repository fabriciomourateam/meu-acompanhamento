import { useCallback, useEffect, useState } from "react";

const MAX_FAVORITES = 20;

const storageKey = (key: string) => `myshape:food-favs:${key}`;

function readFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeToStorage(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(list.slice(-MAX_FAVORITES)));
  } catch {
    /* quota — ignora */
  }
}

/**
 * Lista de alimentos favoritos do paciente (até 20), persistida em localStorage
 * por chave (ex: patientId). Retorna API: list, has, toggle, add, remove, clear.
 */
export function useFoodFavorites(scopeKey: string | undefined) {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    if (!scopeKey) return;
    setList(readFromStorage(scopeKey));
  }, [scopeKey]);

  useEffect(() => {
    if (!scopeKey) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(scopeKey)) setList(readFromStorage(scopeKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [scopeKey]);

  const has = useCallback((id: string) => list.includes(id), [list]);

  const add = useCallback(
    (id: string) => {
      if (!scopeKey) return;
      setList((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id].slice(-MAX_FAVORITES);
        writeToStorage(scopeKey, next);
        return next;
      });
    },
    [scopeKey]
  );

  const remove = useCallback(
    (id: string) => {
      if (!scopeKey) return;
      setList((prev) => {
        const next = prev.filter((x) => x !== id);
        writeToStorage(scopeKey, next);
        return next;
      });
    },
    [scopeKey]
  );

  const toggle = useCallback(
    (id: string) => {
      if (!scopeKey) return;
      setList((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id].slice(-MAX_FAVORITES);
        writeToStorage(scopeKey, next);
        return next;
      });
    },
    [scopeKey]
  );

  const clear = useCallback(() => {
    if (!scopeKey) return;
    setList([]);
    writeToStorage(scopeKey, []);
  }, [scopeKey]);

  return { list, has, add, remove, toggle, clear, max: MAX_FAVORITES };
}
