import { TestBed } from '@angular/core/testing';

import { QlikAPIService } from './qlik-api.service';

describe('QlikApiService', () => {
  let service: QlikAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QlikAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
