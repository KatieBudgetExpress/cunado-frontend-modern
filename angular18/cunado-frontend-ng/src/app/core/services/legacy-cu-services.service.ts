import { Injectable } from '@angular/core';
import { CuServicesAdapter } from './cu-services-adapter.service';
import { LegacyCuServicesCompat } from './legacy-cu-services-compat.service';

/**
 * Legacy façade exposing an API compatible with the legacy `cuServices` object.
 * It dispatches resource/action calls to `CuServicesAdapter` and helper methods to `LegacyCuServicesCompat`.
 */
@Injectable({ providedIn: 'root' })
export class LegacyCuServices {
  constructor(private adapter: CuServicesAdapter, private compat: LegacyCuServicesCompat) {}

  // Generic dispatcher used by legacy code: resource(action, ...args)
  async dispatch(resource: string, action: string, ...args: any[]): Promise<any> {
    const methodName = `${resource}_${action}`;
    const fn = (this.adapter as any)[methodName];
    if (typeof fn === 'function') {
      const obs = fn.apply(this.adapter, args);
      // adapter exposes asPromise helper; use it to return a Promise
      return this.adapter.asPromise(obs);
    }
    return Promise.reject(new Error(`No adapter method for ${methodName}`));
  }

  // Expose common resource-style wrappers used by legacy code for convenience
  viRegleSousPosteBudgetaire(action: string, ...args: any[]) { return this.dispatch('viRegleSousPosteBudgetaire', action, ...args); }
  regle(action: string, ...args: any[]) { return this.dispatch('regle', action, ...args); }
  regleDate(action: string, ...args: any[]) { return this.dispatch('regleDate', action, ...args); }
  regleImpact(action: string, ...args: any[]) { return this.dispatch('regleImpact', action, ...args); }
  regleException(action: string, ...args: any[]) { return this.dispatch('regleException', action, ...args); }
  viSousPosteBudgetaire(action: string, ...args: any[]) { return this.dispatch('viSousPosteBudgetaire', action, ...args); }
  viPosteBudgetaire(action: string, ...args: any[]) { return this.dispatch('viPosteBudgetaire', action, ...args); }
  valideUnicite(action: string, ...args: any[]) { return this.dispatch('valideUnicite', action, ...args); }
  viSousPosteBudgetaireRegleValidation(action: string, ...args: any[]) { return this.dispatch('viSousPosteBudgetaireRegleValidation', action, ...args); }
  sousPosteBudgetaireRegle(action: string, ...args: any[]) { return this.dispatch('sousPosteBudgetaireRegle', action, ...args); }

  // Helper wrappers delegated to compat
  supprimeRegleDateImpact(idBudget: number, idRegle: number, opt?: any) { return this.compat.supprimeRegleDateImpact(idBudget, idRegle, opt); }
  supprimeSousPosteBudgetaireRegle(idBudget: number, idRegle: number, idSousPosteBudgetaireRegle: number) { return this.compat.supprimeSousPosteBudgetaireRegle(idBudget, idRegle, idSousPosteBudgetaireRegle); }
  message(action: string, err: any, showToastr: boolean) { return this.compat.message(action, err, showToastr); }

  // Direct pass-throughs for methods already present on adapter
  viRegleSousPosteBudgetaire_getParBudgetCateg() { return (this.adapter as any).viRegleSousPosteBudgetaire_getParBudgetCateg.apply(this.adapter, arguments as any); }
}
