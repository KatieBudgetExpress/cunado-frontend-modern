import { Injectable } from '@angular/core';

/**
 * Lightweight notification service.
 * - Exposes success/error/info/warn methods
 * - Implementation is UI-agnostic and can be replaced by a real renderer later
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(message: string): void {
    // Default behaviour: log to console. Replaceable by UI integration later.
    console.log('SUCCESS:', message);
  }

  error(message: string): void {
    console.error('ERROR:', message);
  }

  info(message: string): void {
    console.info('INFO:', message);
  }

  warn(message: string): void {
    console.warn('WARN:', message);
  }
}
