import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reminder,
  ReminderStatus,
  ReminderStage,
  PushyaSchedule,
  ReminderStats,
  WhatsAppPreview,
  WhatsAppTemplate,
} from '../interfaces/reminder.interface';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  ReminderResponseDto,
  PushyaScheduleResponseDto,
  ReminderStatsDto,
  UpdateReminderStatusDto,
} from '../dto/reminder.dto';
import {
  buildReminderViewModel,
  buildReminderListViewModel,
  buildPushyaScheduleViewModel,
  buildUpdateReminderStatusDto,
} from '../dto/dto-builders';

@Injectable({
  providedIn: 'root',
})
export class ReminderApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.reminderApiUrl || 'http://localhost:5002/api/reminders';

  // Reactive State Signals
  public pushyaDates = signal<PushyaSchedule[]>([]);
  public reminders = signal<Reminder[]>([]);
  public statistics = signal<ReminderStats>({
    totalScheduled: 10,
    totalSent: 5,
    totalDelivered: 5,
    totalRead: 3,
    totalFailed: 0,
    upcomingPushyaDate: '2026-07-18',
  });
  public isLoading = signal<boolean>(false);
  public isDatabaseConnected = signal<boolean>(false);

  // Dynamic next upcoming Pushya schedule based on current date
  public upcomingPushya = computed<PushyaSchedule | null>(() => {
    const list = this.pushyaDates();
    if (!list || list.length === 0) return null;

    const sorted = [...list].sort(
      (a, b) => new Date(a.pushyaDate).getTime() - new Date(b.pushyaDate).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = sorted.find((item) => {
      const pDate = new Date(item.pushyaDate);
      pDate.setHours(0, 0, 0, 0);
      return pDate.getTime() >= today.getTime();
    });

    return next || sorted[sorted.length - 1];
  });

  private mockPushyaDates: PushyaSchedule[] = [
    { pushyaDate: '2026-06-21', stage1FireDate: '2026-06-20', stage2FireDate: '2026-06-21', label: 'Ashadha Pushya', isActive: true },
    { pushyaDate: '2026-07-18', stage1FireDate: '2026-07-17', stage2FireDate: '2026-07-18', label: 'Shravana Pushya', isActive: true },
    { pushyaDate: '2026-08-14', stage1FireDate: '2026-08-13', stage2FireDate: '2026-08-14', label: 'Bhadrapada Pushya', isActive: true },
    { pushyaDate: '2026-09-10', stage1FireDate: '2026-09-09', stage2FireDate: '2026-09-10', label: 'Ashwina Pushya', isActive: true },
    { pushyaDate: '2026-10-07', stage1FireDate: '2026-10-06', stage2FireDate: '2026-10-07', label: 'Kartika Pushya', isActive: true },
    { pushyaDate: '2026-11-03', stage1FireDate: '2026-11-02', stage2FireDate: '2026-11-03', label: 'Margashirsha Pushya', isActive: true },
    { pushyaDate: '2026-12-01', stage1FireDate: '2026-11-30', stage2FireDate: '2026-12-01', label: 'Pausha Pushya', isActive: true },
  ];

  constructor() {
    this.pushyaDates.set(this.mockPushyaDates);
  }

  /**
   * Loads upcoming Pushya Nakshatra schedule from backend.
   */
  public loadPushyaDates(): Observable<PushyaSchedule[]> {
    return this.http.get<ApiResponse<PushyaScheduleResponseDto[]>>(`${this.apiUrl}/pushya-dates`).pipe(
      map((res) => {
        this.isDatabaseConnected.set(res.databaseConnected ?? true);
        const list = (res.data || []).map(buildPushyaScheduleViewModel);
        if (list.length > 0) {
          this.pushyaDates.set(list);
          return list;
        }
        return this.pushyaDates();
      }),
      catchError(() => {
        this.isDatabaseConnected.set(false);
        return of(this.pushyaDates());
      })
    );
  }

  /**
   * Adds a new Pushya date via HTTP POST /api/reminders/pushya-dates.
   */
  public addPushyaDate(pushyaDate: string, label?: string): Observable<PushyaSchedule | null> {
    return this.http
      .post<ApiResponse<PushyaScheduleResponseDto>>(`${this.apiUrl}/pushya-dates`, {
        pushyaDate,
        label,
      })
      .pipe(
        map((res) => {
          if (res.data) {
            const created = buildPushyaScheduleViewModel(res.data);
            this.pushyaDates.update((prev) => [...prev, created]);
            return created;
          }
          return null;
        }),
        catchError(() => {
          // Calculate 1-day reminder fire date fallback
          const d = new Date(pushyaDate);
          d.setDate(d.getDate() - 1);
          const stage1FireDate = d.toISOString().split('T')[0];
          const localItem: PushyaSchedule = {
            pushyaDate,
            stage1FireDate,
            stage2FireDate: pushyaDate,
            label: label || 'Pushya Session',
            isActive: true,
          };
          this.pushyaDates.update((prev) => [...prev, localItem]);
          return of(localItem);
        })
      );
  }

  /**
   * Updates an existing Pushya date at a specific index or by date string and syncs with backend database.
   */
  public updatePushyaDate(
    target: number | string,
    newDate: string,
    label?: string
  ): Observable<PushyaSchedule | null> {
    const currentList = this.pushyaDates();
    let oldDate = '';
    let index = -1;

    if (typeof target === 'number') {
      index = target;
      oldDate = currentList[target]?.pushyaDate || '';
    } else {
      oldDate = target;
      index = currentList.findIndex((p) => p.pushyaDate === target);
    }

    const d = new Date(newDate);
    d.setDate(d.getDate() - 1);
    const stage1FireDate = d.toISOString().split('T')[0];

    const updatedItem: PushyaSchedule = {
      pushyaDate: newDate,
      stage1FireDate,
      stage2FireDate: newDate,
      label: label || (index >= 0 ? currentList[index]?.label : undefined) || 'Pushya Session',
      isActive: true,
    };

    // Optimistically replace old date with new date (preventing duplicate entries)
    this.pushyaDates.update((prev) => {
      const filtered = prev.filter((p) => p.pushyaDate !== oldDate && p.pushyaDate !== newDate);
      const next = [...filtered, updatedItem].sort((a, b) => a.pushyaDate.localeCompare(b.pushyaDate));
      return next;
    });

    const endpointUrl = oldDate
      ? `${this.apiUrl}/pushya-dates/${oldDate}`
      : `${this.apiUrl}/pushya-dates`;

    return this.http
      .put<ApiResponse<PushyaScheduleResponseDto>>(endpointUrl, {
        oldDate: oldDate || newDate,
        newDate,
        pushyaDate: newDate,
        label: updatedItem.label,
      })
      .pipe(
        map((res) => {
          if (res && res.data) {
            const updated = buildPushyaScheduleViewModel(res.data);
            return updated;
          }
          return updatedItem;
        }),
        catchError((err) => {
          console.warn(`⚠️ [ReminderApiService] PUT /api/reminders/pushya-dates fallback:`, err.message);
          return of(updatedItem);
        })
      );
  }

  /**
   * Deletes a Pushya date session at a specific index or by date string and synchronizes with backend database.
   */
  public deletePushyaDate(target: number | string): Observable<boolean> {
    let dateToDelete = '';
    const currentList = this.pushyaDates();

    if (typeof target === 'number') {
      dateToDelete = currentList[target]?.pushyaDate || '';
    } else {
      dateToDelete = target;
    }

    // Optimistically update reactive signals
    this.pushyaDates.update((prev) => {
      if (typeof target === 'number') {
        return prev.filter((_, i) => i !== target);
      }
      return prev.filter((s) => s.pushyaDate !== target);
    });

    if (!dateToDelete) {
      return of(true);
    }

    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/pushya-dates/${dateToDelete}`)
      .pipe(
        map((res) => {
          return res.success;
        }),
        catchError((err) => {
          console.warn(
            `⚠️ [ReminderApiService] DELETE /api/reminders/pushya-dates/${dateToDelete} fallback:`,
            err.message
          );
          return of(true);
        })
      );
  }

  /**
   * Loads reminders for a specific Pushya date and stage.
   */
  public loadReminders(pushyaDate?: string, stage?: ReminderStage): Observable<Reminder[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (pushyaDate) params = params.set('pushyaDate', pushyaDate);
    if (stage) params = params.set('stage', stage.toString());

    return this.http.get<ApiResponse<ReminderResponseDto[]>>(this.apiUrl, { params }).pipe(
      map((res) => {
        this.isDatabaseConnected.set(res.databaseConnected ?? true);
        const list = buildReminderListViewModel(res.data || []);
        this.reminders.set(list);
        this.isLoading.set(false);
        return list;
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.reminders());
      })
    );
  }

  /**
   * Loads aggregated statistics from backend.
   */
  public loadStatistics(): Observable<ReminderStats> {
    return this.http.get<ApiResponse<ReminderStatsDto>>(`${this.apiUrl}/statistics`).pipe(
      map((res) => {
        this.isDatabaseConnected.set(res.databaseConnected ?? true);
        if (res.data) {
          this.statistics.set(res.data);
          return res.data;
        }
        return this.statistics();
      }),
      catchError(() => {
        return of(this.statistics());
      })
    );
  }

  /**
   * Updates status of a reminder (sent, delivered, read) via DTO builder.
   */
  public updateReminderStatus(
    reminderId: string,
    status: ReminderStatus,
    customTimestamp?: string
  ): Observable<Reminder | null> {
    const dto: UpdateReminderStatusDto = buildUpdateReminderStatusDto(status, customTimestamp);

    return this.http
      .put<ApiResponse<ReminderResponseDto>>(`${this.apiUrl}/${reminderId}/status`, dto)
      .pipe(
        map((res) => {
          const updated = buildReminderViewModel(res.data);
          this.reminders.update((prev) =>
            prev.map((r) => (r.id === reminderId ? updated : r))
          );
          return updated;
        }),
        catchError(() => {
          this.reminders.update((prev) =>
            prev.map((r) => (r.id === reminderId ? { ...r, status } : r))
          );
          return of(this.reminders().find((r) => r.id === reminderId) || null);
        })
      );
  }

  /**
   * Retrieves WhatsApp message templates for 3-days-before (Stage 1) and day-of (Stage 2).
   */
  public loadWhatsAppTemplates(): Observable<WhatsAppTemplate[]> {
    return this.http.get<ApiResponse<WhatsAppTemplate[]>>(`${this.apiUrl}/whatsapp/templates`).pipe(
      map((res) => res.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Previews WhatsApp message for a given patient and stage.
   */
  public previewWhatsApp(
    patientName: string,
    phone: string,
    pushyaDate: string,
    stage: ReminderStage
  ): Observable<WhatsAppPreview | null> {
    return this.http
      .post<ApiResponse<WhatsAppPreview>>(`${this.apiUrl}/whatsapp/preview`, {
        patientName,
        phone,
        pushyaDate,
        stage,
      })
      .pipe(
        map((res) => res.data || null),
        catchError(() => of(null))
      );
  }

  /**
   * Sends or updates a single WhatsApp reminder for a patient.
   */
  public sendSingleWhatsApp(
    patientId: string,
    patientName: string,
    phone: string,
    pushyaDate: string,
    stage: ReminderStage,
    customMessage?: string
  ): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/whatsapp/send-single`, {
        patientId,
        patientName,
        phone,
        pushyaDate,
        stage,
        customMessage,
      })
      .pipe(
        map((res) => res.data),
        catchError(() => of(null))
      );
  }

  /**
   * Triggers evaluation and dispatch of WhatsApp reminders due today.
   */
  public triggerTodayWhatsApp(targetDate?: string): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/whatsapp/trigger-today`, { targetDate })
      .pipe(
        map((res) => res.data),
        catchError(() => of(null))
      );
  }

  /**
   * Syncs reminders from patient roster for a specific Pushya date.
   */
  public syncPatientsForPushya(pushyaDate: string): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/sync-patients`, { pushyaDate })
      .pipe(
        map((res) => res.data),
        catchError(() => of(null))
      );
  }

  /**
   * Loads WhatsApp message audit logs.
   */
  public loadWhatsAppLogs(reminderId?: string, limit: number = 50): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (reminderId) params = params.set('reminderId', reminderId);

    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/whatsapp/logs`, { params })
      .pipe(
        map((res) => res.data || []),
        catchError(() => of([]))
      );
  }
}
