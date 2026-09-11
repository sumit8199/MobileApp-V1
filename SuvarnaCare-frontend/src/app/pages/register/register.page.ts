import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  schoolOutline,
  medkitOutline,
  ribbonOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  arrowBackOutline,
  sparklesOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { AuthService } from '@core/services/auth.service';

/** Custom validator to check that password and confirmPassword match */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmPassword.setErrors(null);
    return null;
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  public registerForm!: FormGroup;
  public showPassword = signal<boolean>(false);
  public showConfirmPassword = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public currentStep = signal<number>(1); // 1 = Clinic & Profile, 2 = Security & Credentials

  constructor() {
    addIcons({
      leafOutline,
      personOutline,
      mailOutline,
      callOutline,
      businessOutline,
      schoolOutline,
      medkitOutline,
      ribbonOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      arrowForwardOutline,
      arrowBackOutline,
      sparklesOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        clinicName: ['', [Validators.required, Validators.minLength(3)]],
        qualification: ['BAMS, MD (Ayurveda)', [Validators.required]],
        specialization: ['Suvarna Prashan & Child Healthcare', [Validators.required]],
        registrationNo: ['', [Validators.required, Validators.minLength(4)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        agreeTerms: [true, [Validators.requiredTrue]],
      },
      { validators: passwordMatchValidator }
    );
  }

  get nameControl() { return this.registerForm.get('name'); }
  get emailControl() { return this.registerForm.get('email'); }
  get phoneControl() { return this.registerForm.get('phone'); }
  get clinicNameControl() { return this.registerForm.get('clinicName'); }
  get qualificationControl() { return this.registerForm.get('qualification'); }
  get specializationControl() { return this.registerForm.get('specialization'); }
  get registrationNoControl() { return this.registerForm.get('registrationNo'); }
  get passwordControl() { return this.registerForm.get('password'); }
  get confirmPasswordControl() { return this.registerForm.get('confirmPassword'); }
  get agreeTermsControl() { return this.registerForm.get('agreeTerms'); }

  public passwordStrength = computed(() => {
    const pwd = this.passwordControl?.value || '';
    if (!pwd) return { score: 0, text: 'Empty', class: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, text: 'Weak', class: 'weak' };
      case 2:
        return { score: 50, text: 'Fair', class: 'fair' };
      case 3:
        return { score: 75, text: 'Good', class: 'good' };
      case 4:
      default:
        return { score: 100, text: 'Strong', class: 'strong' };
    }
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  goToNextStep(): void {
    // Validate Step 1 controls
    const step1Fields = ['name', 'email', 'phone', 'clinicName', 'qualification', 'specialization', 'registrationNo'];
    let step1Valid = true;
    for (const field of step1Fields) {
      const ctrl = this.registerForm.get(field);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) {
        step1Valid = false;
      }
    }

    if (step1Valid) {
      this.errorMessage.set('');
      this.currentStep.set(2);
    } else {
      this.errorMessage.set('Please fill in all required clinic and doctor details accurately.');
    }
  }

  goToPreviousStep(): void {
    this.errorMessage.set('');
    this.currentStep.set(1);
  }

  fillSampleDoctor(): void {
    this.registerForm.patchValue({
      name: 'Dr. Rajesh Deshmukh',
      email: 'rajesh.deshmukh@ayurveda.org',
      phone: '9822012345',
      clinicName: 'Deshmukh Ayurvedic Chikitsalaya & Panchakarma',
      qualification: 'BAMS, MS (Ayurveda)',
      specialization: 'Suvarna Prashan & Pediatric Wellness',
      registrationNo: 'AYUSH/MH/2018/7821',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      agreeTerms: true,
    });
    this.errorMessage.set('');
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Please check and correct the errors in the registration form.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const form = this.registerForm.value;

    this.authService.register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      clinicName: form.clinicName,
      qualification: form.qualification,
      specialization: form.specialization,
      registrationNo: form.registrationNo,
      password: form.password,
    }).subscribe({
      next: async (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          const doctorName = res.user?.name || form.name || res.user?.email || 'Doctor';
          const toast = await this.toastCtrl.create({
            message: `Account created for ${doctorName}! Saved in Local Storage.`,
            duration: 3000,
            color: 'success',
            position: 'top',
            icon: 'checkmark-circle-outline',
          });
          await toast.present();

          this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
        } else {
          this.errorMessage.set(res.message || 'Registration failed. Please try again.');
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set('An unexpected error occurred during registration.');
        console.error('Registration error', err);
      },
    });
  }
}
