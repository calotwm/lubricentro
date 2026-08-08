const STORAGE_KEY = "lubricentro_token";

let navigateRef: ((path: string) => void) | null = null;

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function registerNavigate(nav: (path: string) => void): void {
  navigateRef = nav;
}

export function navigate(path: string): void {
  if (navigateRef) {
    navigateRef(path);
  }
}
