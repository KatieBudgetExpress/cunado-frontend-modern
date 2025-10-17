import { TestBed } from '@angular/core/testing';
import { LegacyCuServicesCompat } from './legacy-cu-services-compat.service';
import { CuServicesAdapter } from './cu-services-adapter.service';
import { NotificationService } from './notification.service';
import { of, throwError } from 'rxjs';

describe('LegacyCuServicesCompat', () => {
  let service: LegacyCuServicesCompat;

  beforeEach(() => {
    const adapterStub: any = {
      regleDate_getParRegle: (_: any) => of({ data: [] }),
      viSousPosteBudgetaireRegleValidation_getParId: (_: any) => of({ data: [] }),
      actionSysteme_doAction: (_code: any, _id1: any, _id2: any, _id3: any) => of({ actionSysteme: {} })
    };

    const notificationsStub: any = {
      success: (_: any) => {},
      error: (_: any) => {},
      info: (_: any) => {},
      warn: (_: any) => {}
    };

    TestBed.configureTestingModule({ providers: [ LegacyCuServicesCompat, { provide: CuServicesAdapter, useValue: adapterStub }, { provide: NotificationService, useValue: notificationsStub } ] });
    service = TestBed.inject(LegacyCuServicesCompat);
  });

  it('supprimeRegleDateImpact should return true on success', async () => {
    const res = await service.supprimeRegleDateImpact(1, 2);
    expect(res).toBeTrue();
  });

  it('supprimeSousPosteBudgetaireRegle should return true on success', async () => {
    const res = await service.supprimeSousPosteBudgetaireRegle(1, 2, 3);
    expect(res).toBeTrue();
  });

  it('supprimeRegleDateImpact should throw mapped LegacyError on SQLSTATE error', async () => {
    const adapter = TestBed.inject(CuServicesAdapter) as any;
    const legacyErr = { message: 'UNIQUE_VIOLATION', code: '23505' };
    spyOn(adapter, 'actionSysteme_doAction').and.returnValue(throwError(() => legacyErr));
    await expectAsync(service.supprimeRegleDateImpact(1, 2)).toBeRejectedWith(legacyErr as any);
  });

  it('supprimeSousPosteBudgetaireRegle should throw mapped LegacyError on SQLSTATE error', async () => {
    const adapter = TestBed.inject(CuServicesAdapter) as any;
    const legacyErr = { message: 'NOT_NULL_VIOLATION', code: '23502' };
    spyOn(adapter, 'actionSysteme_doAction').and.returnValue(throwError(() => legacyErr));
    await expectAsync(service.supprimeSousPosteBudgetaireRegle(1, 2, 3)).toBeRejectedWith(legacyErr as any);
  });

  it('message returns normalized object and logs when showToastr true', () => {
    const notifications = TestBed.inject(NotificationService) as any;
    spyOn(notifications, 'success');
    const out = service.message('create', null, true);
    expect(out).toBeDefined();
    expect(out.action).toBe('create');
    expect(notifications.success).toHaveBeenCalled();
  });

  it('message should call error notification when err present and showToastr true', () => {
    const notifications = TestBed.inject(NotificationService) as any;
    spyOn(notifications, 'error');
    const out = service.message('create', { message: 'ERR' }, true);
    expect(out).toBeDefined();
    expect(notifications.error).toHaveBeenCalled();
  });
});
