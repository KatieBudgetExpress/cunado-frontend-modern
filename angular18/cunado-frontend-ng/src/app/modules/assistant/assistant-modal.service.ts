import { Injectable } from '@angular/core';
import { AssistantModalComponent } from './assistant-modal.component';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';

// Note: This scaffold uses a minimal in-memory modal factory for unit testing.
@Injectable({ providedIn: 'root' })
export class AssistantModalService {
  constructor(private orchestrator: AssistantOrchestratorService) {}

  open(settings: any): { result: Promise<any> } {
    // In production this will open a dialog and wire AssistantModalComponent.
    const p = this.orchestrator.start(settings);
    return { result: p };
  }
}
