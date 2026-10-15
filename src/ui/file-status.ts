// The file indicator next to the Save and Load buttons.
export function setFileStatus(message: string, connected = false): void {
  const status = document.getElementById("file-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("connected", connected);
  status.title = connected
    ? `${message}. Save writes your changes to this JSON file. Browsers may hide its parent folders.`
    : `${message}. Your work is kept in this browser until you save it to a JSON file; browsers may hide a selected file's parent folders.`;
}
