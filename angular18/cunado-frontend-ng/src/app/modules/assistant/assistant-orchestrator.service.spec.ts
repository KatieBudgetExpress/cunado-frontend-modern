import { TestBed } from '@angular/core/testing';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';
import { CuServicesAdapter } from '../../core/services/cu-services-adapter.service';
import { of } from 'rxjs';

describe('AssistantOrchestratorService', () => {
  let service: AssistantOrchestratorService;

  beforeEach(() => {
    // mock adapter methods used by the minimal orchestrator — return Observables so firstValueFrom resolves
    const adapterStub: any = {
      viSousPosteBudgetaire_getParCateg: (_: any) => of({ data: [] }),
      viPosteBudgetaire_getParCateg: (_: any) => of({ data: [] }),
      viRegleSousPosteBudgetaire_getParBudgetCateg: (_: any) => of({ data: [] })
    };

    TestBed.configureTestingModule({ providers: [ AssistantOrchestratorService, { provide: CuServicesAdapter, useValue: adapterStub } ] });
    service = TestBed.inject(AssistantOrchestratorService);
  });

  it('start should resolve with assistant object and call adapter', async () => {
    const res = await service.start({ categorie: { id: 1 }, idBudget: 2 });
    expect(res).toBeDefined();
    expect(res.sousPoste).toBeNull();
  });
});
