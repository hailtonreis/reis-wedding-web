import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './hero.html',
  styleUrl: './hero.css' 
})
export class HeroComponent implements OnInit, OnDestroy {
  // Ajuste a data para o dia do casamento
  @Input() targetDate: Date = new Date('2028-12-12T17:00:00');

  // Resolve o erro TS2339 (Property 'timeLeft' does not exist)
  timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateCountdown();
    this.timerId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const distance = this.targetDate.getTime() - now;

    if (distance < 0) {
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    this.timeLeft = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  }
}