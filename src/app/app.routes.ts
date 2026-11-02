
import { Routes } from '@angular/router';
import { WeddingHomeComponent } from './features/wedding-home/wedding-home';

export const routes: Routes = [
  {
    path: 'design-system',
    loadComponent: () =>
      import('./features/design-system/design-system')
        .then(m => m.DesignSystemComponent)
  },
  {
    path: 'wedding',
    component: WeddingHomeComponent
  },
{
  path: 'wedding/rsvp',
  loadComponent: () =>
    import('./features/wedding-home/components/rsvp/rsvp')
      .then(m => m.RsvpComponent)
}
];
