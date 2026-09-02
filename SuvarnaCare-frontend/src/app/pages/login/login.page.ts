import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonCheckbox,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logInOutline,
  personAddOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  medkitOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonIcon,
    IonSpinner,
    IonCheckbox,
  ],
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  public loginForm!: FormGroup;
  public showPassword = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');

  constructor() {
    addIcons({
      leafOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      logInOutline,
      personAddOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
      medkitOutline,
      checkmarkCircleOutline,
      arrowForwardOutline,
      alertCircleOutline,
    });
  }

  ngOnInit(): void {
    const remembered = this.authService.getRememberedIdentifier();
    this.loginForm = this.fb.group({
      emailOrPhone: [remembered || '', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [!!remembered],
    });
  }

  get emailOrPhoneControl() {
    return this.loginForm.get('emailOrPhone');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  fillDemoCredentials(): void {
    const demo = this.authService.getDemoCredentials();
    this.loginForm.patchValue({
      emailOrPhone: demo.email,
      password: demo.password,
      rememberMe: true,
    });
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValues = this.loginForm.value;

    this.authService.login({
      emailOrPhone: formValues.emailOrPhone,
      password: formValues.password,
      rememberMe: formValues.rememberMe,
    }).subscribe({
      next: async (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.user) {
          this.successMessage.set(`Welcome, ${res.user.name}!`);
          
          const toast = await this.toastCtrl.create({
            message: `Welcome back, ${res.user.name}`,
            duration: 2000,
            color: 'success',
            position: 'top',
            icon: 'checkmark-circle-outline',
          });
          await toast.present();

          this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
        } else {
          this.errorMessage.set(res.message || 'Login failed. Please check your credentials.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('An unexpected error occurred. Please try again.');
        console.error('Login error', err);
      },
    });
  }
}
