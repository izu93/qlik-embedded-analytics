import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WritebackTableComponent } from './writeback-table.component';

describe('WritebackTableComponent', () => {
  let component: WritebackTableComponent;
  let fixture: ComponentFixture<WritebackTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritebackTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WritebackTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
