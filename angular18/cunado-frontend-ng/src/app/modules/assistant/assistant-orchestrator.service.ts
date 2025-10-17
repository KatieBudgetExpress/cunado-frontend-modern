import { Injectable } from '@angular/core';
import { CuServicesAdapter } from '../../core/services/cu-services-adapter.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssistantOrchestratorService {
  constructor(private adapter: CuServicesAdapter) {}

  /**
   * Minimal orchestration skeleton:
   * - accepts settings (may contain categorie, idBudget, ...)
   * - performs a few lightweight adapter calls to populate LOVs (simulated)
   * - returns the placeholder assistant result object
   * Errors from adapter are propagated as-is (LegacyError)
   */
  async start(settings: any): Promise<any> {
    const categorieId = settings && settings.categorie ? settings.categorie.id : (settings && settings.idCategorie ? settings.idCategorie : null);
    const idBudget = settings && settings.idBudget ? settings.idBudget : null;

    try {
      const sousPostePromise = categorieId != null ? firstValueFrom(this.adapter.viSousPosteBudgetaire_getParCateg(categorieId)) : Promise.resolve(null);
      const postePromise = categorieId != null ? firstValueFrom(this.adapter.viPosteBudgetaire_getParCateg(categorieId)) : Promise.resolve(null);
      const comptesPromise = idBudget != null ? firstValueFrom(this.adapter.viRegleSousPosteBudgetaire_getParBudgetCateg(idBudget)) : Promise.resolve(null);

      // Await in parallel; we don't implement business logic yet — just simulate the calls
      await Promise.all([sousPostePromise, postePromise, comptesPromise]);

      // Return placeholder object conforming to legacy contract
      return { sousPoste: null, regle: null, image: null, typeImage: null };
    } catch (err) {
      // propagate adapter-mapped LegacyError
      throw err;
    }
  }
}
