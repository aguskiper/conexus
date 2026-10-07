// Fallback en memoria si el navegador bloquea sessionStorage.
export function attemptStorage(getStorage: () => Pick<Storage, "getItem" | "setItem" | "removeItem">) {
  const memory = new Map<string, string>();
  return {
    getItem(key: string) { if (memory.has(key)) return memory.get(key)!; try { return getStorage().getItem(key); } catch { return null; } },
    setItem(key: string, value: string) { memory.set(key, value); try { getStorage().setItem(key, value); } catch {} },
    removeItem(key: string) { memory.delete(key); try { getStorage().removeItem(key); } catch {} },
  };
}
