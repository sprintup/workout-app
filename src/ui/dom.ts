// Typed lookups for the elements index.html provides.

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function dialogById(id: string): HTMLDialogElement {
  return byId<HTMLDialogElement>(id);
}

export function inputById(id: string): HTMLInputElement {
  return byId<HTMLInputElement>(id);
}

export function formById(id: string): HTMLFormElement {
  return byId<HTMLFormElement>(id);
}

/** A named control of a form, e.g. formField(form, "name"). */
export function formField(form: HTMLFormElement, name: string): HTMLInputElement {
  return (form.elements as unknown as Record<string, HTMLInputElement>)[name];
}
