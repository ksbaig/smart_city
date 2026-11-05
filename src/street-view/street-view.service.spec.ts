import { TestBed } from '@angular/core/testing';

import { StreetViewService } from './street-view.service';

describe('StreetViewService', () => {
  let service: StreetViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreetViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
