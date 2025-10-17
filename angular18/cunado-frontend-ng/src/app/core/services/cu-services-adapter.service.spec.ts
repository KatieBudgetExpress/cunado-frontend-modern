import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CuServicesAdapter } from './cu-services-adapter.service';

describe('CuServicesAdapter', () => {
  let service: CuServicesAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CuServicesAdapter]
    });
    service = TestBed.inject(CuServicesAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should normalize numeric string to number and call valideUnicite', (done) => {
    const body = { table: 'regleException', condition: ' WHERE t."idRegle" = 1', champUnique: 'dateRegle' };
    service.valideUnicite_getParCondition(body.table, body.condition, body.champUnique).subscribe(res => {
      expect(res).toBeDefined();
      done();
    });
    const req = httpMock.expectOne(r => r.url.includes('/valideUnicite/getParCondition'));
    expect(req.request.method).toBe('POST');
    req.flush({ data: [] });
  });

  it('should map 23505 UNIQUE_VIOLATION', (done) => {
    service.valideUnicite_getParCondition('t','c','u').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err).toBeDefined();
        expect(err.code).toBe('23505');
        expect(err.message).toBe('UNIQUE_VIOLATION');
        done();
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/valideUnicite/getParCondition'));
    req.flush({ code: '23505' }, { status: 409, statusText: 'Conflict' });
  });

  it('should map 23502 NOT_NULL_VIOLATION', (done) => {
    service.valideUnicite_getParCondition('t','c','u').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.code).toBe('23502');
        expect(err.message).toBe('NOT_NULL_VIOLATION');
        done();
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/valideUnicite/getParCondition'));
    req.flush({ sqlState: '23502' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should map 22P02 INVALID_TEXT_REPRESENTATION', (done) => {
    service.valideUnicite_getParCondition('t','c','u').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.code).toBe('22P02');
        expect(err.message).toBe('INVALID_TEXT_REPRESENTATION');
        done();
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/valideUnicite/getParCondition'));
    req.flush({ code: '22P02' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should map invalid datetime (22007) to INVALID_DATETIME_FORMAT', (done) => {
    service.valideUnicite_getParCondition('t','c','u').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.code).toBe('22007');
        expect(err.message).toBe('INVALID_DATETIME_FORMAT');
        done();
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/valideUnicite/getParCondition'));
    req.flush({ sqlState: '22007' }, { status: 400, statusText: 'Bad Request' });
  });

  it('should normalize regle_create payload (montant number + date string) and return regle', (done) => {
    const payload: any = { montant: '123,45', dateRegle: new Date('2025-10-17') };
    service.regle_create(payload).subscribe(res => {
      expect(res).toBeDefined();
      expect((res as any).regle).toBeDefined();
      done();
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/regle'));
    expect(req.request.method).toBe('POST');
    // montant should be normalized to number and dateRegle to 'YYYY-MM-DD'
    expect(typeof req.request.body.montant).toBe('number');
    expect(req.request.body.montant).toBeCloseTo(123.45, 2);
    expect(req.request.body.dateRegle).toBe('2025-10-17');
    req.flush({ regle: { id: 1 } });
  });

  it('should normalize regleException_create payload (montantException, booleans, dates)', (done) => {
    const payload: any = { montantException: '10,5', aucunVersement: '1', concilie: '0', dateRegle: '2025-10-17', dateException: new Date('2025-10-18') };
    service.regleException_create(payload).subscribe(res => {
      expect(res).toBeDefined();
      expect((res as any).regleException).toBeDefined();
      done();
    });
    const req = httpMock.expectOne(r => r.url.endsWith('/regleException'));
    expect(req.request.method).toBe('POST');
    expect(typeof req.request.body.montantException).toBe('number');
    expect(req.request.body.montantException).toBeCloseTo(10.5, 2);
    expect(typeof req.request.body.aucunVersement).toBe('boolean');
    expect(req.request.body.aucunVersement).toBeTrue();
    expect(typeof req.request.body.concilie).toBe('boolean');
    expect(req.request.body.concilie).toBeFalse();
    expect(req.request.body.dateException).toBe('2025-10-18');
    req.flush({ regleException: { id: 5 } });
  });

  it('should send correct body for actionSysteme_doAction and return any', (done) => {
    service.actionSysteme_doAction('CODE', 11, 22, undefined, 1, 7).subscribe(res => {
      expect(res).toBeDefined();
      done();
    });
    const req = httpMock.expectOne(r => r.url.includes('/actionSysteme/doAction'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.idReference1).toBe(11);
    expect(req.request.body.valeurParamInt1).toBe(7);
    req.flush({ result: true });
  });

  it('should perform HTTP DELETE for regleExceptionVentilation_remove', (done) => {
    service.regleExceptionVentilation_remove(123).subscribe(res => {
      expect(res).toBeDefined();
      done();
    });
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.includes('/regleExceptionVentilation/123'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ removed: true });
  });

  it('asPromise should resolve observable to a promise value', async () => {
    const p = service.asPromise(service.viSequenceMax_getSeq());
    const req = httpMock.expectOne(r => r.url.includes('/viSequenceMax/getSeq'));
    expect(req.request.method).toBe('POST');
    req.flush({ seq: 42 });
    const val = await p;
    expect((val as any).seq).toBe(42);
  });
});
