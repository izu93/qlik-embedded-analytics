import { TestBed } from '@angular/core/testing';

import { QlikApiService } from './qlik-api.service';

describe('QlikApiService', () => {
  let service: QlikApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QlikApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
