import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WritebackTableStaticDataComponent } from './writeback-table-static-data.component';

describe('WritebackTableStaticDataComponent', () => {
  let component: WritebackTableStaticDataComponent;
  let fixture: ComponentFixture<WritebackTableStaticDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritebackTableStaticDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WritebackTableStaticDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
