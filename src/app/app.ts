import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Course, Order, Testimonial } from './services/api.service';

export interface HeroSlide {
  badge: string;
  title: string;
  titleEn: string;
  description: string;
  image: string;
  tag: string;
  stats: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private api = inject(ApiService);

  // Navigation
  activeView = signal<'home' | 'my-courses'>('home');

  // Hero Slider
  currentSlide = signal<number>(0);
  private autoSlideTimer: any;
  isSliderHovered = signal<boolean>(false);

  slides: HeroSlide[] = [
    {
      badge: 'ডিজিটাল মার্কেটিং ও গ্রোথ হ্যাকিং',
      title: 'প্রফেশনাল স্কিল শিখে গড়ে তুলুন স্মার্ট ক্যারিয়ার',
      titleEn: 'Digital Marketing & Social Media Strategy',
      description: 'ফেসবুক ও গুগল অ্যাডস, সেলস ফানেল এবং লিড জেনারেশনের বাস্তবমুখী প্র্যাক্টিক্যাল কোর্স। আধুনিক বিজনেসের চাহিদা অনুযায়ী নিজের স্কিল বাড়ান।',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop',
      tag: 'হ্যান্ডস-অন প্রজেক্ট ও কেস স্টাডি',
      stats: '৪২+ রেকর্ডেড ক্লাস • লাইফটাইম সাপোর্ট'
    },
    {
      badge: 'এসইও ও অর্গানিক র‍্যাংকিং',
      title: 'গুগল ১ম পেজে র‍্যাংক করার সেরা টেকনিক শিখুন',
      titleEn: 'Advanced SEO & Content Strategy',
      description: 'অন-পেজ, অফ-পেজ ও টেকনিক্যাল এসইও শিখে যেকোনো ওয়েবসাইটকে গুগলে টপ পজিশনে আনুন। দেশি ও বিদেশি ক্লায়েন্টদের জন্য হাই-ভ্যালু স্কিল।',
      image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=1200&auto=format&fit=crop',
      tag: '১০০% প্র্যাক্টিক্যাল গাইডলাইন',
      stats: '৩৬+ ভিডিও ক্লাস • রিসোর্স ফাইল'
    },
    {
      badge: 'ক্রিয়েটিভ ডিজাইন ও ভিডিও এডিটিং',
      title: 'গ্রাফিক ডিজাইন ও ভিডিও এডিটিংয়ে সফল ফ্রিল্যান্সিং',
      titleEn: 'Graphic Design, Video Editing & UI/UX',
      description: 'ফটোশপ, ইলাস্ট্রেটর, প্রিমিয়ার প্রো ও ফিগমা শিখে ফ্রিল্যান্সিং মার্কেটপ্লেসে ইন-ডিমান্ড ক্রিয়েটিভ প্রজেক্ট তৈরি ও আন্তর্জাতিক ক্লায়েন্ট হ্যান্ডেল করুন।',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop',
      tag: 'কোর্স সমাপনী সার্টিফিকেট',
      stats: '৫,০০০+ শিক্ষার্থী • ৪.৯/৫ রেটিং'
    }
  ];

  // Courses
  courses = signal<Course[]>([]);
  loadingCourses = signal<boolean>(true);
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');

  // Computed Categories & Filtered Courses
  categories = computed(() => {
    const list = this.courses().map(c => c.subject).filter((s): s is string => Boolean(s));
    return ['All', ...Array.from(new Set(list))];
  });

  filteredCourses = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.courses().filter(c => {
      const matchCat = cat === 'All' || c.subject?.toLowerCase() === cat.toLowerCase();
      const matchQuery = !q || 
        c.title.toLowerCase().includes(q) || 
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  });

  // Course Details Preview Modal
  previewCourse = signal<Course | null>(null);

  // User Auth state
  isLoggedIn = signal<boolean>(false);
  userName = signal<string>('');
  userEmail = signal<string>('');
  showAuthModal = signal<boolean>(false);
  authMode = signal<'login' | 'register'>('login');

  loginForm = { email: '', password: '' };
  registerForm = { fullName: '', email: '', password: '', phoneNumber: '' };
  authError = signal<string>('');
  authLoading = signal<boolean>(false);

  // Checkout modal
  selectedCourse = signal<Course | null>(null);
  showCheckoutModal = signal<boolean>(false);
  checkoutLoading = signal<boolean>(false);
  lastPaymentInit = signal<any>(null);

  // Student orders / Enrolled courses
  myOrders = signal<Order[]>([]);

  // Testimonials / Success stories
  testimonials = signal<Testimonial[]>([]);

  // Toast
  toastMessage = signal<string>('');

  ngOnInit() {
    this.checkSession();
    this.loadCourses();
    this.loadTestimonials();
    this.checkUrlPaymentParams();
    this.startAutoSlide();
  }

  loadTestimonials() {
    this.api.getTestimonials().subscribe({
      next: (res) => this.testimonials.set(res),
      error: (err) => console.error('Failed to load testimonials:', err)
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  // Slider controls
  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      if (!this.isSliderHovered()) {
        this.nextSlide();
      }
    }, 5500);
  }

  stopAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  nextSlide() {
    this.currentSlide.update(idx => (idx + 1) % this.slides.length);
  }

  prevSlide() {
    this.currentSlide.update(idx => (idx - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.startAutoSlide();
  }

  onSliderMouseEnter() {
    this.isSliderHovered.set(true);
  }

  onSliderMouseLeave() {
    this.isSliderHovered.set(false);
  }

  // Session & Auth
  checkSession() {
    const token = localStorage.getItem('tm_student_token');
    const name = localStorage.getItem('tm_student_name');
    const email = localStorage.getItem('tm_student_email');
    if (token) {
      this.isLoggedIn.set(true);
      this.userName.set(name || 'Student');
      this.userEmail.set(email || '');
      this.loadMyOrders();
    }
  }

  checkUrlPaymentParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const tranId = params.get('tran_id');

      if (paymentStatus === 'success') {
        this.showToast('🎉 অভিনন্দন! আপনার পেমেন্ট সফল হয়েছে এবং কোর্সের এক্সেস ডিটেইলস আপনার ইমেইলে পাঠানো হয়েছে।');
        this.activeView.set('my-courses');
        this.loadMyOrders();
        // Clean URL params without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'failed') {
        alert('Payment was not completed or failed. Please try again or use simulation.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'cancelled') {
        this.showToast('Payment was cancelled.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }

  loadCourses() {
    this.loadingCourses.set(true);
    this.api.getCourses(true).subscribe({
      next: (res) => {
        this.courses.set(res);
        this.loadingCourses.set(false);
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.loadingCourses.set(false);
      }
    });
  }

  loadMyOrders() {
    if (!this.isLoggedIn()) return;
    this.api.getMyOrders().subscribe({
      next: (res) => this.myOrders.set(res),
      error: (err) => console.error('Error loading my orders:', err)
    });
  }

  openAuthModal(mode: 'login' | 'register') {
    this.authMode.set(mode);
    this.authError.set('');
    this.showAuthModal.set(true);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
  }

  submitLogin() {
    this.authLoading.set(true);
    this.authError.set('');

    this.api.login(this.loginForm).subscribe({
      next: (res) => {
        this.authLoading.set(false);
        localStorage.setItem('tm_student_token', res.token);
        localStorage.setItem('tm_student_name', res.fullName);
        localStorage.setItem('tm_student_email', res.email);
        this.isLoggedIn.set(true);
        this.userName.set(res.fullName);
        this.userEmail.set(res.email);
        this.closeAuthModal();
        this.loadMyOrders();
        this.showToast(`স্বাগতম, ${res.fullName}!`);

        if (this.selectedCourse()) {
          this.proceedToCheckout(this.selectedCourse()!);
        }
      },
      error: (err) => {
        this.authLoading.set(false);
        this.authError.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  submitRegister() {
    this.authLoading.set(true);
    this.authError.set('');

    this.api.register(this.registerForm).subscribe({
      next: (res) => {
        this.authLoading.set(false);
        localStorage.setItem('tm_student_token', res.token);
        localStorage.setItem('tm_student_name', res.fullName);
        localStorage.setItem('tm_student_email', res.email);
        this.isLoggedIn.set(true);
        this.userName.set(res.fullName);
        this.userEmail.set(res.email);
        this.closeAuthModal();
        this.loadMyOrders();
        this.showToast(`অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম, ${res.fullName}`);

        if (this.selectedCourse()) {
          this.proceedToCheckout(this.selectedCourse()!);
        }
      },
      error: (err) => {
        this.authLoading.set(false);
        this.authError.set(err.error?.message || 'Registration failed. Email might already exist.');
      }
    });
  }

  logout() {
    localStorage.removeItem('tm_student_token');
    localStorage.removeItem('tm_student_name');
    localStorage.removeItem('tm_student_email');
    this.isLoggedIn.set(false);
    this.userName.set('');
    this.userEmail.set('');
    this.myOrders.set([]);
    this.activeView.set('home');
    this.showToast('You have been signed out.');
  }

  // Course Preview Modal
  openPreview(course: Course) {
    this.previewCourse.set(course);
  }

  closePreview() {
    this.previewCourse.set(null);
  }

  // Enrollment & Checkout Flow
  startEnrollment(course: Course) {
    this.selectedCourse.set(course);

    if (!this.isLoggedIn()) {
      this.openAuthModal('login');
      return;
    }

    this.proceedToCheckout(course);
  }

  proceedToCheckout(course: Course) {
    this.selectedCourse.set(course);
    this.checkoutLoading.set(true);
    this.showCheckoutModal.set(true);
    this.lastPaymentInit.set(null);

    this.api.checkout(course.id).subscribe({
      next: (res) => {
        this.checkoutLoading.set(false);
        this.lastPaymentInit.set(res);
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        alert('Checkout error: ' + (err.error?.message || err.message));
        this.showCheckoutModal.set(false);
      }
    });
  }

  payWithGateway(url: string) {
    if (!url) return;
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  simulateSuccess(tranId: string) {
    this.api.simulatePayment(tranId).subscribe({
      next: () => {
        this.showCheckoutModal.set(false);
        this.showToast('🎉 পেমেন্ট সফল হয়েছে! কোর্স অ্যাক্সেস লিংক আপনার ইমেইলে পাঠিয়ে দেওয়া হয়েছে।');
        this.loadMyOrders();
        this.activeView.set('my-courses');
      },
      error: (err) => alert('Simulation failed: ' + (err.error?.message || err.message))
    });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 5000);
  }
}
