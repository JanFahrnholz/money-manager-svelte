import { get, writable } from "svelte/store";

export function storable(key, data) {
  const store = writable(data);
  const { subscribe, set, update } = store;
  const isBrowser = typeof window !== "undefined";

  if (localStorage.getItem(key)) {
    try{
      set(JSON.parse(localStorage.getItem(key)));
    }catch(e){
      set(undefined)
    }
  }

  return {
    subscribe,
    set: (n) => {
      localStorage.setItem(key, JSON.stringify(n));
      set(n);
    },
    update: (cb) => {
      const updatedStore = cb(get(store));

      localStorage.setItem(key, JSON.stringify(updatedStore));
      set(updatedStore);
    },
  };
}
