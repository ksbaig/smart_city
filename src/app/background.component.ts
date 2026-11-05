import { Component } from '@angular/core';

@Component({
  selector: 'app-background',
  standalone: true,
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss'],
  host: {
    '[attr.data-theme]': 'theme',
    'class': 'app-background',
  }
})
export class BackgroundComponent {
  theme: 'light' | 'dark' = 'light';
}
