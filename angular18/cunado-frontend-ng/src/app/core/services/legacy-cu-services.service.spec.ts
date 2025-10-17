import { TestBed } from '@angular/core/testing';
import { LegacyCuServices } from './legacy-cu-services.service';
import { CuServicesAdapter } from './cu-services-adapter.service';
import { LegacyCuServicesCompat } from './legacy-cu-services-compat.service';
import { of } from 'rxjs';

describe('LegacyCuServices', () => {
  let service: LegacyCuServices;

  beforeEach(() => {
    const adapterStub: any = {
      viRegleSousPosteBudgetaire_getParBudgetCateg: (_: any) => of({ data: [] }),
      asPromise: (obs: any) => Promise.resolve({ data: [] })
    };
    const compatStub: any = {
      supprimeRegleDateImpact: (_: any, __: any) => Promise.resolve(true),
      supprimeSousPosteBudgetaireRegle: (_: any, __: any, ___: any) => Promise.resolve(true),
      message: (_: any, __: any, ___: any) => ({})
    };
    TestBed.configureTestingModule({ providers: [ LegacyCuServices, { provide: CuServicesAdapter, useValue: adapterStub }, { provide: LegacyCuServicesCompat, useValue: compatStub } ] });
    service = TestBed.inject(LegacyCuServices);
  });

  it('dispatch should call adapter method and return Promise', async () => {
    const res = await service.dispatch('viRegleSousPosteBudgetaire', 'getParBudgetCateg', 1);
    expect(res).toBeDefined();
  });

  it('supprime wrappers should delegate to compat', async () => {
    const r1 = await service.supprimeRegleDateImpact(1,2);
    expect(r1).toBeTrue();
    const r2 = await service.supprimeSousPosteBudgetaireRegle(1,2,3);
    expect(r2).toBeTrue();
    const m = service.message('create', null, true);
    expect(m).toBeDefined();
  });
});
