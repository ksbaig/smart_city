import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActiveDirectorySsoService } from "../../core/services/active-directory-sso.service";

@Component({
  selector: "app-login-overlay",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login-overlay.component.html",
  styleUrl: "./login-overlay.component.scss",
})
export class LoginOverlayComponent {
  @Output() loginSuccess = new EventEmitter<string>();

  private readonly ssoService = new ActiveDirectorySsoService();

  readonly users = ["Smart City", "Utility", "Housing", "Mobility", "Tourism", "Mining"];
  readonly dashboardStats = [
    { label: "Districts", value: "15", icon: "bi-map" },
    { label: "Facilities", value: "1,240", icon: "bi-building" },
    { label: "Active Alerts", value: "08", icon: "bi-bell" },
    { label: "Coverage", value: "92%", icon: "bi-bar-chart-line" },
  ];

  readonly features = [
    { title: "City Command Center", icon: "bi-building-check" },
    { title: "Smart Banking", icon: "bi-bank2" },
    { title: "Urban Planning", icon: "bi-layers" },
    { title: "Transportation", icon: "bi-car-front" },
    { title: "Utilities Management", icon: "bi-lightning-charge" },
    { title: "Healthcare & Education", icon: "bi-hospital" },
    { title: "Environment & Sustainability", icon: "bi-tree" },
    { title: "3D Digital Twin", icon: "bi-boxes" },
  ];
  selectedUser = "Smart City";
  password = "";
  rememberMe = false;
  passwordVisible = false;
  errorMessage = "";
  ssoMessage = "";

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  continueWithSso(): void {
    const result = this.ssoService.startLogin(this.selectedUser);
    this.errorMessage = "";
    this.ssoMessage = `Signed in with Active Directory SSO as ${result.userName}.`;
    this.loginSuccess.emit(result.userName);
  }

  submit(): void {
    const normalizedUser = this.selectedUser.trim().toLowerCase();
    const allowedUsers = new Set(this.users.map((user) => user.toLowerCase()));

    if (!allowedUsers.has(normalizedUser) || this.password !== "123") {
      this.errorMessage = "Invalid user or password.";
      return;
    }

    this.errorMessage = "";
    this.ssoMessage = "";
    this.loginSuccess.emit(this.selectedUser);
  }
}
