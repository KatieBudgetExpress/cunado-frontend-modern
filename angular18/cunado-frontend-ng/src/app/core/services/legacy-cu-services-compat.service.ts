import { Injectable } from '@angular/core';
import { CuServicesAdapter } from './cu-services-adapter.service';
import { firstValueFrom } from 'rxjs';
import { LegacyError } from './legacy-types';
import { NotificationService } from './notification.service';

/**
 * Compatibility wrappers that reproduce legacy `cuServices` helper methods.
 * Implement minimal behavior and redirect calls to `CuServicesAdapter` where possible.
 */
@Injectable({ providedIn: 'root' })
export class LegacyCuServicesCompat {
  constructor(private adapter: CuServicesAdapter, private notifications: NotificationService) {}

  // Supprime les regleDate associés à une règle. Legacy: cuServices.supprimeRegleDateImpact(budgetId, regleId, ...)
  async supprimeRegleDateImpact(idBudget: number, idRegle: number, _opt?: any): Promise<boolean> {
    try {
      // Use actionSysteme.doAction to perform legacy delete action
      await firstValueFrom(this.adapter.actionSysteme_doAction('SUPPRIME_DATE_IMPACT', idBudget, idRegle, _opt || null));
      return true;
    } catch (err: any) {
      // Adapter maps SQL errors to LegacyError via throw; if it's a mapped LegacyError, rethrow or return false per legacy behaviour
      if ((err as LegacyError) && (err as LegacyError).code) {
        // propagate mapped error for caller awareness
        throw err;
      }
      return false;
    }
  }

  // Supprime le sous-poste-budgetaire-regle, returns true/false
  async supprimeSousPosteBudgetaireRegle(idBudget: number, idRegle: number, idSousPosteBudgetaireRegle: number): Promise<boolean> {
    try {
      // Perform system action to remove the sous-poste-budgetaire-regle
      await firstValueFrom(this.adapter.actionSysteme_doAction('SUPPRIME_REGLE', idBudget, idRegle, idSousPosteBudgetaireRegle));
      return true;
    } catch (err: any) {
      if ((err as LegacyError) && (err as LegacyError).code) {
        throw err;
      }
      return false;
    }
  }

  // Legacy message helper — normalize adapter error to simple object and optionally log
  message(action: string, err: any, showToastr: boolean) {
    // adapter already maps SQLSTATE to LegacyError in other flows; here we normalize shape
    const out: any = { action, error: err };
    if (showToastr) {
      const text = (err && (err as LegacyError).message) ? (err as LegacyError).message : String(err);
      if (action === 'delete') {
        if (!err) this.notifications.success(text); else this.notifications.error(text);
      } else if (action === 'update' || action === 'create') {
        if (!err) this.notifications.success(text); else this.notifications.error(text);
      } else {
        this.notifications.info(text);
      }
    }
    return out;
  }
}
