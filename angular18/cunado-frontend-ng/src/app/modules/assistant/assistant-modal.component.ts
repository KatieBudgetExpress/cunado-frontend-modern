import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assistant-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="assistant-modal">
      <h3>Assistant</h3>
      <div *ngIf="data"><!-- minimal scaffold --></div>
      <button (click)="confirm()">Confirm</button>
      <button (click)="cancel()">Cancel</button>
    </div>
  `
})
export class AssistantModalComponent {
  @Input() data: any;
  @Output() closed = new EventEmitter<any>();

  confirm() {
    // returns a minimal object compatible with legacy contract
    this.closed.emit({ sousPoste: null, regle: null, image: null, typeImage: null });
  }

  cancel() {
    this.closed.emit(false);
  }
}
