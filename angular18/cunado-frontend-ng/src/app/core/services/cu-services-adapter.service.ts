import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { QueryResponse, RegleResponse, RegleExceptionResponse, SousPosteResponse, LegacyError } from './legacy-types';

@Injectable({ providedIn: 'root' })
export class CuServicesAdapter {
  private base = (window as any).__env && (window as any).__env.legacyApiBase || '/priver';

  constructor(private http: HttpClient) {}

  // --- Normalization helpers ---
  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Math.round(value * 100) / 100;
    const n = Number(String(value).replace(',', '.'));
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  }

  private toBoolean(value: any): boolean {
    if (value === true || value === false) return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    return false;
  }

  private toDateString(value: any): string | null {
    if (!value && value !== 0) return null;
    if (value instanceof Date) return value.toISOString().slice(0,10);
    const s = String(value).trim();
    // if already YYYY-MM-DD roughly
    const m = /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (m) return s;
    // try parse
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return null;
  }

  private normalizePayload(obj: any, numericFields: string[] = [], booleanFields: string[] = [], dateFields: string[] = []) {
    const out: any = { ...obj };
    numericFields.forEach(f => { if (f in out) out[f] = this.toNumber(out[f]); });
    booleanFields.forEach(f => { if (f in out) out[f] = this.toBoolean(out[f]); });
    dateFields.forEach(f => { if (f in out) out[f] = this.toDateString(out[f]); });
    // Turn empty strings into nulls for non-string fields
    Object.keys(out).forEach(k => {
      if (out[k] === '') out[k] = null;
    });
    return out;
  }

  private mapPgSqlError(err: HttpErrorResponse): LegacyError {
    const le: LegacyError = { message: 'Unknown error', details: err.error };
    // Many backends embed sql state in err.error.code or err.error.sqlState
    const code = err && err.error && (err.error.code || err.error.sqlState || err.statusText);
    if (code) le.code = String(code);
    if (err.status === 409 || le.code === '23505') {
      le.message = 'UNIQUE_VIOLATION';
    } else if (le.code === '23502') {
      le.message = 'NOT_NULL_VIOLATION';
    } else if (le.code === '22P02') {
      le.message = 'INVALID_TEXT_REPRESENTATION';
    } else if (le.code === '22007' || le.code === '22008') {
      le.message = 'INVALID_DATETIME_FORMAT';
    } else if (err.status >= 500) {
      le.message = 'SERVER_ERROR';
    } else {
      le.message = err.message || err.statusText || 'HTTP_ERROR';
    }
    return le;
  }

  // --- Example methods mapping cuServices ---

  // valideUnicite(getParCondition)
  valideUnicite_getParCondition(table: string, condition: string, champUnique: string): Observable<QueryResponse<any>> {
    const body = { table, condition, champUnique };
    return this.http.post<QueryResponse<any>>(`${this.base}/valideUnicite/getParCondition`, body).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // viRegleSousPosteBudgetaire.getParBudgetCateg
  viRegleSousPosteBudgetaire_getParBudgetCateg(idBudget: number, idCat1?: number, idCat2?: number, idCat3?: number, idCat4?: number, idCat5?: number, idSousPosteBudgetaireRegle?: number): Observable<QueryResponse<any>> {
    const body = { idBudget, idSousPosteBudgetaireRegle, idCat1, idCat2, idCat3, idCat4, idCat5 };
    return this.http.post<QueryResponse<any>>(`${this.base}/viRegleSousPosteBudgetaire/getParBudgetCateg`, body).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  viRegleSousPosteBudgetaire_getParBudgetId(idBudget: number, idSousPosteBudgetaireRegle: number): Observable<QueryResponse<any>> {
    const body = { idBudget, idSousPosteBudgetaireRegle };
    return this.http.post<QueryResponse<any>>(`${this.base}/viRegleSousPosteBudgetaire/getParBudgetId`, body).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // regle.getParLienType
  regle_getParLienType(idRegleLienTransfert: number, idTypeOperation: number): Observable<QueryResponse<any>> {
    const body = { idRegleLienTransfert, idTypeOperation };
    return this.http.post<QueryResponse<any>>(`${this.base}/regle/getParLienType`, body).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // Generic POST helper
  private post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}`, body).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // ---- Remaining cuServices methods (mapped to endpoints) ----

  viAnalyseRegleDetailInfo_getParBudgetDate(idBudget: number, dateDebut: string, dateFin: string) {
    return this.post<QueryResponse<any>>('viAnalyseRegleDetailInfo/getParBudgetDate', { idBudget, dateDebut, dateFin });
  }

  viAnalyseRegleDetailInfo_getParBudget(idBudget: number) {
    return this.post<QueryResponse<any>>('viAnalyseRegleDetailInfo/getParBudget', { idBudget });
  }

  viRegleSousPosteBudgetaire_getParLovNullable(idBudget: number, idCat1?: number, idCat2?: number, idCat3?: number, idCat4?: number, idCat5?: number, idSousPosteBudgetaireRegle?: number) {
    return this.post<QueryResponse<any>>('viRegleSousPosteBudgetaire/getParLovNullable', { idBudget, idSousPosteBudgetaireRegle, idCat1, idCat2, idCat3, idCat4, idCat5 });
  }

  viRegleSousPosteBudgetaire_getParLovTous(idBudget: number, idCat1?: number, idCat2?: number) {
    return this.post<QueryResponse<any>>('viRegleSousPosteBudgetaire/getParLovTous', { idBudget, idCat1, idCat2 });
  }

  viRegleSousPosteBudgetaire_getParGroupe(idBudget: number, idCat1?: number) {
    return this.post<QueryResponse<any>>('viRegleSousPosteBudgetaire/getParGroupe', { idBudget, idCat1 });
  }

  regle_getParLienTypeDate(id: number, idTypeOperation: number, dateEvenement: string) {
    return this.post<QueryResponse<any>>('regle/getParLienTypeDate', { idRegleLienTransfert: id, idTypeOperation, dateEvenement });
  }

  regle_getParSousPosteMaitre(idSousPosteBudgetaireRegle: number) {
    return this.post<QueryResponse<any>>('regle/getParSousPosteMaitre', { idSousPosteBudgetaireRegle });
  }

  regleImpact_getParRegle(idRegle: number) {
    return this.post<QueryResponse<any>>('regleImpact/getParRegle', { idRegle });
  }

  regleException_getParRegle(idRegle: number) {
    return this.post<QueryResponse<any>>('regleException/getParRegle', { idRegle });
  }

  regleException_getParRegleDate(idRegle: number, dateRegle: string) {
    return this.post<QueryResponse<any>>('regleException/getParRegleDate', { idRegle, dateRegle });
  }

  regleDate_getParRegle(idRegle: number) {
    return this.post<QueryResponse<any>>('regleDate/getParRegle', { idRegle });
  }

  viRegleSolde_getParSousPosteRegleMaitre(idSousPosteBudgetaireRegle: number, maitre: number) {
    return this.post<QueryResponse<any>>('viRegleSolde/getParSousPosteRegleMaitre', { idSousPosteBudgetaireRegle, maitre });
  }

  viSousPosteBudgetaire_getParId(id: number) {
    return this.post<QueryResponse<any>>('viSousPosteBudgetaire/getParId', { id });
  }

  viSousPosteBudgetaire_getParCateg(idCategorie: number) {
    return this.post<QueryResponse<any>>('viSousPosteBudgetaire/getParCateg', { idCategorie });
  }

  viPosteBudgetaire_getParCateg(idCategorie: number) {
    return this.post<QueryResponse<any>>('viPosteBudgetaire/getParCateg', { idCategorie });
  }

  viPosteBudgetaire_getAll() {
    return this.post<QueryResponse<any>>('viPosteBudgetaire/getAll', {});
  }

  viSousPosteBudgetaireRegleValidation_getParId(idSousPosteBudgetaireRegle: number) {
    return this.post<QueryResponse<any>>('viSousPosteBudgetaireRegleValidation/getParId', { idSousPosteBudgetaireRegle });
  }

  viRegleAjustement_getParId(idSousPosteBudgetaireRegle: number) {
    return this.post<QueryResponse<any>>('viRegleAjustement/getParId', { idSousPosteBudgetaireRegle });
  }

  viRegleException_getParIdRegle(idRegle: number) {
    return this.post<QueryResponse<any>>('viRegleException/getParIdRegle', { idRegle });
  }

  viRegleExceptionCache_getParIdRegleDateRegle(idRegle: number, dateRegle: string) {
    return this.post<QueryResponse<any>>('viRegleExceptionCache/getParIdRegleDateRegle', { idRegle, dateRegle });
  }

  viAnalyseRegleDetail_getPrecedent(idRegle: number, dateDebut: string, dateFin: string, dateRef: string) {
    return this.post<QueryResponse<any>>('viAnalyseRegleDetail/getPrecedent', { idRegle, dateDebut, dateFin, dateRef });
  }

  viAnalyseRegleDetail_getSuivant(idRegle: number, dateDebut: string, dateFin: string, dateRef: string) {
    return this.post<QueryResponse<any>>('viAnalyseRegleDetail/getSuivant', { idRegle, dateDebut, dateFin, dateRef });
  }

  actionSysteme_doAction(codeAction: string, idRef1: number, idRef2?: number, idRef3?: number, force: number = 0, valeurParamInt1?: number) {
    const body: any = { codeAction, idReference1: idRef1, idReference2: idRef2, idReference3: idRef3, force };
    if (valeurParamInt1 !== undefined) body.valeurParamInt1 = valeurParamInt1;
    return this.post<any>('actionSysteme/doAction', body);
  }

  importFile_getFileOfxQfx(file: any) { return this.post<any>('importFile/getFileOfxQfx', { file }); }
  importFile_getFileCsv(file: any) { return this.post<any>('importFile/getFileCsv', { file }); }
  importFile_getFileDb(file: any)  { return this.post<any>('importFile/getFileDb', { file }); }

  viConciliationSectionDepRev_getParDate(idBudget: number, date1: string, date2: string) {
    return this.post<QueryResponse<any>>('viConciliationSectionDepRev/getParDate', { idBudget, date1, date2 });
  }

  viRapportDetailleSectionCompteCredit_getParSousPoste(idSousPosteBudgetaireRegle: number) {
    return this.post<QueryResponse<any>>('viRapportDetailleSectionCompteCredit/getParSousPoste', { idSousPosteBudgetaireRegle });
  }

  viRapportDetailleSectionDepRev_getParBudgetCat(idBudget: number, categorieRevenu: any, categorieDepense: any, idSousPosteBudgetaireRegle?: number) {
    return this.post<QueryResponse<any>>('viRapportDetailleSectionDepRev/getParBudgetCat', { idBudget, categorieRevenu, categorieDepense, idSousPosteBudgetaireRegle });
  }

  viRapport_getVentilation() { return this.post<QueryResponse<any>>('viRapport/getVentilation', {}); }

  viRapportSommaireSectionDepRev_getParPoste(payload: any) { return this.post<QueryResponse<any>>('viRapportSommaireSectionDepRev/getParPoste', payload); }
  viRapportSommaireSectionDepRev_getParSousPoste(payload: any) { return this.post<QueryResponse<any>>('viRapportSommaireSectionDepRev/getParSousPoste', payload); }

  viAnalyseRegleSommaireInfoPoste_getParCategorie(payload: any) { return this.post<QueryResponse<any>>('viAnalyseRegleSommaireInfoPoste/getParCategorie', payload); }

  viReglePosteBudgetaire_getParBudgetCateg(idBudget: number, idCategorie: number) {
    return this.post<QueryResponse<any>>('viReglePosteBudgetaire/getParBudgetCateg', { idBudget, idCategorie });
  }

  viSequenceMax_getSeq() { return this.post<any>('viSequenceMax/getSeq', {}); }

  viLienBancaire_getLovLienBancaireActif() { return this.post<QueryResponse<any>>('viLienBancaire/getLovLienBancaireActif', {}); }
  viLienBancaire_getLovLienBancaireTous() { return this.post<QueryResponse<any>>('viLienBancaire/getLovLienBancaireTous', {}); }

  // RegleExceptionVentilation resource
  regleExceptionVentilation_getParRegleException(idRegleException: number) { return this.post<QueryResponse<any>>('regleExceptionVentilation/getParRegleException', { idRegleException }); }
  regleExceptionVentilation_getId(id: number) { return this.post<any>('regleExceptionVentilation/getId', { id }); }
  regleExceptionVentilation_remove(id: number) { return this.http.delete<any>(`${this.base}/regleExceptionVentilation/${id}`).pipe(catchError(err => throwError(() => this.mapPgSqlError(err)))); }

  // SousPosteBudgetaireRegle resource
  sousPosteBudgetaireRegle_getId(id: number) { return this.post<SousPosteResponse>('sousPosteBudgetaireRegle/getId', { id }); }
  sousPosteBudgetaireRegle_getCptPrinc(payload: any) { return this.post<QueryResponse<any>>('sousPosteBudgetaireRegle/getCptPrinc', payload); }
  sousPosteBudgetaireRegle_getParBudget(payload: any) { return this.post<QueryResponse<any>>('sousPosteBudgetaireRegle/getParBudget', payload); }

  // ViRegleTransfertCompte
  viRegleTransfertCompte_getParSousPosteRegleRegle(payload: any) { return this.post<QueryResponse<any>>('viRegleTransfertCompte/getParSousPosteRegleRegle', payload); }
  viRegleTransfertCompte_getParSousPosteRegleType(payload: any) { return this.post<QueryResponse<any>>('viRegleTransfertCompte/getParSousPosteRegleType', payload); }


  // RegleException create/update (example) — normalizes payloads
  regleException_create(payload: any): Observable<RegleExceptionResponse> {
    const normalized = this.normalizePayload(payload, ['montantException'], ['aucunVersement','concilie'], ['dateRegle','dateException']);
    return this.http.post<RegleExceptionResponse>(`${this.base}/regleException`, normalized).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  regleException_update(payload: any): Observable<RegleExceptionResponse> {
    const normalized = this.normalizePayload(payload, ['montantException'], ['aucunVersement','concilie'], ['dateRegle','dateException']);
    return this.http.put<RegleExceptionResponse>(`${this.base}/regleException`, normalized).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // Generic createRegle (example)
  regle_create(payload: any): Observable<RegleResponse> {
    const normalized = this.normalizePayload(payload, ['montant'], [], ['dateRegle']);
    return this.http.post<RegleResponse>(`${this.base}/regle`, normalized).pipe(
      catchError(err => throwError(() => this.mapPgSqlError(err)))
    );
  }

  // Utility: expose Promise-based wrappers for backward compatibility
  async asPromise<T>(obs: Observable<T>): Promise<T> {
    return await firstValueFrom(obs as Observable<T>);
  }

}
