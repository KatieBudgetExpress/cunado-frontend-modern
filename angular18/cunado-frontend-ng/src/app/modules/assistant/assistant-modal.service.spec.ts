import { TestBed } from '@angular/core/testing';
import { AssistantModalService } from './assistant-modal.service';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';

describe('AssistantModalService', () => {
  let service: AssistantModalService;

  beforeEach(() => {
    const orchestratorStub = { start: (_: any) => Promise.resolve({ sousPoste: null }) } as any;
    TestBed.configureTestingModule({ providers: [ AssistantModalService, { provide: AssistantOrchestratorService, useValue: orchestratorStub } ] });
    service = TestBed.inject(AssistantModalService);
  });

  it('open should return object with result promise', async () => {
    const r = service.open({});
    expect(r).toBeDefined();
    const val = await r.result;
    expect(val).toBeDefined();
    expect(val.sousPoste).toBeNull();
  });
});
