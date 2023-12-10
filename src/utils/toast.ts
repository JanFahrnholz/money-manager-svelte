import { f7 } from "framework7-svelte";

export const errorToast = ({ message }) => {
  f7.toast
    .create({
      text: message,
      position: "top",
      closeTimeout: 2000,
    })
    .open();
};
