import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ActiveDirectorySsoService {
  readonly enabled = true;

  startLogin(userName: string): { userName: string; loginMode: "sso" } {
    const normalizedUser = userName.trim() || "Investment";
    return {
      userName: normalizedUser,
      loginMode: "sso",
    };
  }
}