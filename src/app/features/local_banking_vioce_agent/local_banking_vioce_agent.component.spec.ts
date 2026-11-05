import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LocalBankingVioceAgentComponent } from "./local_banking_vioce_agent.component";

describe("LocalBankingVioceAgentComponent", () => {
  let component: LocalBankingVioceAgentComponent;
  let fixture: ComponentFixture<LocalBankingVioceAgentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalBankingVioceAgentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalBankingVioceAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});