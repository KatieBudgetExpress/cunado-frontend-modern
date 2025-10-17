import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssistantModalComponent } from './assistant-modal.component';

describe('AssistantModalComponent', () => {
  let fixture: ComponentFixture<AssistantModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AssistantModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(AssistantModalComponent);
    fixture.componentInstance.data = { foo: 'bar' };
    fixture.detectChanges();
  });

  it('should render and emit on confirm/cancel', () => {
    const el: HTMLElement = fixture.nativeElement;
    const confirm = el.querySelector('button:nth-of-type(1)') as HTMLButtonElement;
    const cancel = el.querySelector('button:nth-of-type(2)') as HTMLButtonElement;

    let closedVal: any = undefined;
    fixture.componentInstance.closed.subscribe((v: any) => closedVal = v);
    confirm.click();
    expect(closedVal).toBeDefined();
    closedVal = undefined;
    cancel.click();
    expect(closedVal).toBeFalse();
  });
});
