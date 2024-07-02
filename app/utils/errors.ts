import { f7 } from "framework7-svelte";
import { ClientResponseError } from "pocketbase";

export class ApiError extends ClientResponseError {
  public display: string;

  constructor(error) {
    super(error);
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = "ApiError";

    this.display = Object.values(error.toJSON().response.data)
      .map((item) => item?.message)
      .join("\n");
  }

  public dialog() {
    f7.dialog.alert(this.display, this.message);
  }
}

export class ErrorDialog {
  constructor(title: string, message?: string){
    f7.dialog.alert(message, title)
  }
}