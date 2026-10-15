import { dialogById } from "./dom";

export let toastTimer;


export function clearDialogMessage(messageId) {
  const message = document.getElementById(messageId);
  if (!message) return;
  message.textContent = "";
  message.className = "dialog-message";
  message.hidden = true;
}


export function activeDialogMessage() {
  const dialogMessages = [
    ["exercise-dialog", "exercise-dialog-message"],
    ["replace-dialog", "replace-dialog-message"],
  ];
  const active = dialogMessages.find(
    ([dialogId]) => dialogById(dialogId)?.open,
  );
  return active ? document.getElementById(active[1]) : null;
}


export function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer);
  toast.className = "toast";
  const dialogMessage = activeDialogMessage();
  if (dialogMessage) {
    dialogMessage.textContent = message;
    dialogMessage.className = `dialog-message${type === "error" ? " error" : ""}`;
    dialogMessage.hidden = false;
    toastTimer = setTimeout(() => {
      dialogMessage.className = "dialog-message";
      dialogMessage.hidden = true;
    }, 5000);
    return;
  }
  toast.textContent = message;
  toast.className = `toast visible ${type === "error" ? "error" : ""}`;
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}
