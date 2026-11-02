import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero';
import { EventDetailsComponent } from './components/event-details/event-details';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { NossaHistoriaComponent } from './components/nossa-historia/nossa-historia';
import { RsvpComponent } from './components/rsvp/rsvp';
import { PresentesComponent } from './components/presentes/presentes';

@Component({
  selector: 'app-wedding-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    EventDetailsComponent,
    NavbarComponent,
    NossaHistoriaComponent,
    RsvpComponent,
    PresentesComponent
  ],
  templateUrl: './wedding-home.html',
  styleUrl: './wedding-home.css'
})
export class WeddingHomeComponent {
}