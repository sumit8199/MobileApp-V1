import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatabaseConnectionStatus, ServiceHealthStatus } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class SqlConnectionService {
  private http = inject(HttpClient);

  public patientHealthUrl =
    environment.patientHealthUrl || 'http://localhost:5001/api/patients/health/db';
  public reminderHealthUrl =
    environment.reminderHealthUrl || 'http://localhost:5002/api/reminders/health/db';

  // Live status signal
  public connectionStatus = signal<DatabaseConnectionStatus>({
    patientService: false,
    reminderService: false,
    sqlServerConnected: false,
    lastChecked: new Date(),
  });

  /**
   * Probes health check endpoints of both SQL Server backend microservices.
   */
  public checkConnections(): Observable<DatabaseConnectionStatus> {
    const patientReq = this.http.get<ServiceHealthStatus>(this.patientHealthUrl).pipe(
      catchError(() => of({ status: 'DOWN', databaseConnected: false } as ServiceHealthStatus))
    );

    const reminderReq = this.http.get<ServiceHealthStatus>(this.reminderHealthUrl).pipe(
      catchError(() => of({ status: 'DOWN', databaseConnected: false } as ServiceHealthStatus))
    );

    return forkJoin([patientReq, reminderReq]).pipe(
      map(([patientRes, reminderRes]) => {
        const isPatientUp = patientRes.status === 'UP';
        const isReminderUp = reminderRes.status === 'UP';
        const isDbOk = Boolean(patientRes.databaseConnected || reminderRes.databaseConnected);

        const status: DatabaseConnectionStatus = {
          patientService: isPatientUp,
          reminderService: isReminderUp,
          sqlServerConnected: isDbOk,
          lastChecked: new Date(),
        };

        this.connectionStatus.set(status);
        return status;
      })
    );
  }
}
