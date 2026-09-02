import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PatientForm } from '../interfaces/patient.interface';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  CreatePatientRequestDto,
  UpdatePatientRequestDto,
  AddSessionHistoryRequestDto,
  PatientResponseDto,
} from '../dto/patient.dto';
import {
  buildCreatePatientDto,
  buildUpdatePatientDto,
  buildPatientViewModel,
  buildPatientListViewModel,
  buildAddSessionHistoryDto,
  calculateAge,
} from '../dto/dto-builders';

@Injectable({
  providedIn: 'root',
})
export class PatientApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.patientApiUrl || 'http://localhost:5001/api/patients';

  // Reactive State Signals
  public patients = signal<Patient[]>([]);
  public isLoading = signal<boolean>(false);
  public isDatabaseConnected = signal<boolean>(false);
  public lastError = signal<string | null>(null);

  // Initial clean fallback mock data
  private mockPatients: Patient[] = [
    {
      id: '1',
      name: 'Arjun Sharma',
      birthDate: '2024-06-15',
      age: '2 yrs',
      parentName: 'Vikram Sharma',
      phone: '9876543210',
      registrationDate: '2026-02-15',
      history: {
        '2026-06-21': {
          sessionDate: '2026-06-21',
          attended: true,
          attendedAt: '09:15 AM',
          visited: true,
          visitedAt: '09:15 AM',
          doseAdministered: true,
        },
        '2026-07-18': {
          sessionDate: '2026-07-18',
          attended: true,
          attendedAt: '10:30 AM',
          visited: true,
          visitedAt: '10:30 AM',
          doseAdministered: true,
        },
      },
    },
    {
      id: '2',
      name: 'Priya Patel',
      birthDate: '2025-02-10',
      age: '18 mo',
      parentName: 'Suresh Patel',
      phone: '9876543211',
      registrationDate: '2026-04-10',
      history: {
        '2026-06-21': {
          sessionDate: '2026-06-21',
          attended: true,
          attendedAt: '09:45 AM',
          visited: true,
          visitedAt: '09:45 AM',
          doseAdministered: true,
        },
      },
    },
    {
      id: '3',
      name: 'Kavya Nair',
      birthDate: '2023-08-20',
      age: '3 yrs',
      parentName: 'Rajan Nair',
      phone: '9876543212',
      registrationDate: '2026-03-20',
      history: {},
    },
    {
      id: '4',
      name: 'Rohan Desai',
      birthDate: '2025-12-05',
      age: '8 mo',
      parentName: 'Amit Desai',
      phone: '9876543213',
      registrationDate: '2026-05-05',
      history: {
        '2026-06-21': {
          sessionDate: '2026-06-21',
          attended: true,
          attendedAt: '11:10 AM',
          visited: true,
          visitedAt: '11:10 AM',
          doseAdministered: true,
        },
        '2026-07-18': {
          sessionDate: '2026-07-18',
          attended: true,
          attendedAt: '10:05 AM',
          visited: true,
          visitedAt: '10:05 AM',
          doseAdministered: true,
        },
      },
    },
    {
      id: '5',
      name: 'Ananya Joshi',
      birthDate: '2024-02-12',
      age: '2.5 yrs',
      parentName: 'Deepak Joshi',
      phone: '9876543214',
      registrationDate: '2026-06-12',
      history: {},
    },
  ];

  constructor() {
    this.patients.set(this.mockPatients.map((p) => ({ ...p, age: calculateAge(p.birthDate) })));
  }

  /**
   * Loads all patients via HTTP GET /api/patients with optional search filter.
   */
  public loadPatients(searchQuery?: string): Observable<Patient[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (searchQuery && searchQuery.trim()) {
      params = params.set('search', searchQuery.trim());
    }

    return this.http.get<ApiResponse<PatientResponseDto[]>>(this.apiUrl, { params }).pipe(
      map((res) => {
        this.isDatabaseConnected.set(res.databaseConnected ?? true);
        const list = buildPatientListViewModel(res.data || []);
        if (list.length > 0) {
          // Merge any active visited session state if already marked locally
          const currentMap = new Map(this.patients().map((p) => [p.id, p]));
          const merged = list.map((remote) => {
            const local = currentMap.get(remote.id);
            if (local && local.history) {
              return {
                ...remote,
                history: {
                  ...remote.history,
                  ...local.history,
                },
              };
            }
            return remote;
          });
          this.patients.set(merged);
        }
        this.isLoading.set(false);
        this.lastError.set(null);
        return this.patients();
      }),
      catchError((err) => {
        console.warn('⚠️ [PatientApiService] GET /api/patients failed, falling back to local cache:', err.message);
        this.isDatabaseConnected.set(false);
        this.isLoading.set(false);
        this.lastError.set(err.message);

        let filtered = [...this.mockPatients].map((p) => ({ ...p, age: calculateAge(p.birthDate) }));
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.phone.includes(q) ||
              p.parentName.toLowerCase().includes(q)
          );
        }
        this.patients.set(filtered);
        return of(filtered);
      })
    );
  }

  /**
   * Retrieves single patient by ID via HTTP GET /api/patients/:id.
   */
  public getPatientById(id: string): Observable<Patient | null> {
    return this.http.get<ApiResponse<PatientResponseDto>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        if (!res.data) return null;
        return buildPatientViewModel(res.data);
      }),
      catchError((err) => {
        console.warn(`⚠️ [PatientApiService] GET /api/patients/${id} failed:`, err.message);
        const local = this.patients().find((p) => p.id === id) || null;
        return of(local);
      })
    );
  }

  /**
   * Registers a new patient via HTTP POST /api/patients.
   */
  public createPatient(form: PatientForm, nextPushyaDate?: string): Observable<Patient> {
    this.isLoading.set(true);
    const dto: CreatePatientRequestDto = buildCreatePatientDto(form, nextPushyaDate);

    return this.http.post<ApiResponse<PatientResponseDto>>(this.apiUrl, dto).pipe(
      map((res) => {
        this.isDatabaseConnected.set(res.databaseConnected ?? true);
        const newPatient = buildPatientViewModel(res.data);
        this.patients.update((prev) => [newPatient, ...prev]);
        this.isLoading.set(false);
        return newPatient;
      }),
      catchError((err) => {
        console.warn('⚠️ [PatientApiService] Fallback local patient creation:', err.message);
        this.isLoading.set(false);
        const fallbackPatient: Patient = {
          id: Date.now().toString(),
          name: dto.name,
          birthDate: dto.birthDate,
          age: calculateAge(dto.birthDate),
          parentName: dto.parentName,
          phone: dto.phone,
          registrationDate: dto.registrationDate || new Date().toISOString().split('T')[0],
          history: {},
        };
        this.mockPatients.unshift(fallbackPatient);
        this.patients.update((prev) => [fallbackPatient, ...prev]);
        return of(fallbackPatient);
      })
    );
  }

  /**
   * Updates patient details via HTTP PUT /api/patients/:id.
   */
  public updatePatient(id: string, form: Partial<PatientForm>): Observable<Patient | null> {
    const dto: UpdatePatientRequestDto = buildUpdatePatientDto(form);

    return this.http.put<ApiResponse<PatientResponseDto>>(`${this.apiUrl}/${id}`, dto).pipe(
      map((res) => {
        if (!res.data) return null;
        const updated = buildPatientViewModel(res.data);
        this.patients.update((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      }),
      catchError((err) => {
        console.warn(`⚠️ [PatientApiService] PUT /api/patients/${id} failed, applying local fallback:`, err.message);
        let fallbackUpdated: Patient | null = null;
        this.patients.update((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              const birthDate = form.birthDate || p.birthDate;
              fallbackUpdated = {
                ...p,
                name: form.name?.trim() || p.name,
                birthDate,
                age: calculateAge(birthDate),
                parentName: form.parentName?.trim() || p.parentName,
                phone: (form.phone || p.phone).replace(/\D/g, '').slice(0, 10),
                registrationDate: form.registrationDate || p.registrationDate,
              };
              return fallbackUpdated;
            }
            return p;
          })
        );
        return of(fallbackUpdated);
      })
    );
  }

  /**
   * Deletes a patient via HTTP DELETE /api/patients/:id.
   */
  public deletePatient(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${id}`).pipe(
      map((res) => {
        this.patients.update((prev) => prev.filter((p) => p.id !== id));
        this.mockPatients = this.mockPatients.filter((p) => p.id !== id);
        return true;
      }),
      catchError((err) => {
        console.warn(`⚠️ [PatientApiService] DELETE /api/patients/${id} failed, applying local removal:`, err.message);
        this.patients.update((prev) => prev.filter((p) => p.id !== id));
        this.mockPatients = this.mockPatients.filter((p) => p.id !== id);
        return of(true);
      })
    );
  }

  /**
   * Records Pushya session history via HTTP POST /api/patients/:id/history.
   */
  public recordSession(
    patientId: string,
    pushyaDate: string,
    stage1Status?: string,
    stage2Status?: string,
    attended?: boolean,
    notes?: string
  ): Observable<Patient | null> {
    const isAttended = attended !== undefined ? attended : true;
    return this.markVisit(patientId, pushyaDate, isAttended, notes);
  }

  /**
   * Marks or updates patient attendance / visit status for a given session date.
   * Immediately updates local signal state and syncs with backend POST /api/patients/:id/history.
   */
  public markVisit(
    patientId: string,
    sessionDate: string,
    visited: boolean,
    notes?: string
  ): Observable<Patient | null> {
    const visitedAt = visited
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;

    const updatePatientState = (p: Patient): Patient => {
      const nextHistory = { ...(p.history || {}) };
      if (visited) {
        nextHistory[sessionDate] = {
          sessionDate,
          attended: true,
          attendedAt: visitedAt || '10:00 AM',
          visited: true,
          visitedAt: visitedAt || '10:00 AM',
          doseAdministered: true,
          notes: notes !== undefined ? notes : nextHistory[sessionDate]?.notes,
        };
      } else {
        nextHistory[sessionDate] = {
          sessionDate,
          attended: false,
          attendedAt: undefined,
          visited: false,
          visitedAt: undefined,
          doseAdministered: false,
          notes: notes !== undefined ? notes : nextHistory[sessionDate]?.notes,
        };
      }

      return {
        ...p,
        history: nextHistory,
      };
    };

    // Immediate reactive local state update
    this.patients.update((prev) =>
      prev.map((p) => (p.id === patientId ? updatePatientState(p) : p))
    );

    // Persist to backend
    const dto: AddSessionHistoryRequestDto = {
      pushyaDate: sessionDate,
      sessionDate,
      attended: visited,
      attendedAt: visited ? (visitedAt || '10:00 AM') : undefined,
      visited,
      visitedAt: visited ? (visitedAt || '10:00 AM') : undefined,
      doseAdministered: visited,
      notes,
    };

    return this.http
      .post<ApiResponse<PatientResponseDto>>(`${this.apiUrl}/${patientId}/history`, dto)
      .pipe(
        map((res) => {
          if (res && res.data) {
            const updated = buildPatientViewModel(res.data);
            // Ensure visited/attended state is preserved
            if (updated.history && updated.history[sessionDate]) {
              updated.history[sessionDate].attended = visited;
              updated.history[sessionDate].attendedAt = visited ? (visitedAt || '10:00 AM') : undefined;
              updated.history[sessionDate].visited = visited;
              updated.history[sessionDate].visitedAt = visited ? (visitedAt || '10:00 AM') : undefined;
              updated.history[sessionDate].doseAdministered = visited;
            }
            this.patients.update((prev) =>
              prev.map((p) => (p.id === patientId ? updated : p))
            );
            return updated;
          }
          return this.patients().find((p) => p.id === patientId) || null;
        }),
        catchError((err) => {
          console.warn(`⚠️ [PatientApiService] History sync for patient ${patientId}:`, err?.message);
          return of(this.patients().find((p) => p.id === patientId) || null);
        })
      );
  }

  /**
   * Toggles visit attendance for a patient on a date.
   */
  public toggleVisit(patientId: string, sessionDate: string): Observable<Patient | null> {
    const target = this.patients().find((p) => p.id === patientId);
    const isCurrentlyVisited = !!(target?.history?.[sessionDate]?.attended ?? target?.history?.[sessionDate]?.visited);
    return this.markVisit(patientId, sessionDate, !isCurrentlyVisited);
  }
}
