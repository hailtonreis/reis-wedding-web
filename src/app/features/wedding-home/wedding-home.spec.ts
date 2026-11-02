import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeddingHome } from './wedding-home';

describe('WeddingHome', () => {
  let component: WeddingHome;
  let fixture: ComponentFixture<WeddingHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeddingHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeddingHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
