import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { RouterLink } from '@angular/router';
import { IonItem, IonLabel, IonAvatar, IonNote } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import type { Contact } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-contact-list-item',
  standalone: true,
  imports: [DecimalPipe, EuroPipe, RouterLink, IonItem, IonLabel, IonAvatar, IonNote, TranslateModule],
  template: `
    <ion-item [routerLink]="routerPath()" detail="true">
      <ion-avatar slot="start" aria-hidden="true">
        <div
          [style.background-color]="avatarColor()"
          style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #fff;
            font-weight: 600;
            font-size: 1.1rem;
          "
        >
          {{ initial() }}
        </div>
      </ion-avatar>
      <ion-label>
        <h2>{{ contact().name }}@if (contact().user) { <span> &#x1F517;</span> }</h2>
        <p [style.color]="scoreColor()">{{ 'score' | translate }}: {{ (contact().score || 0) | number:'1.0-0' }}</p>
      </ion-label>
      <ion-note slot="end" [color]="balanceColor()">
        {{ contact().balance | euro }}
      </ion-note>
    </ion-item>
  `,
})
export class ContactListItemComponent {
  readonly contact = input.required<Contact>();

  readonly routerPath = computed(() => ['/tabs/contacts', this.contact().id]);

  readonly initial = computed(() => {
    const name = this.contact().name;
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  readonly avatarColor = computed(() => {
    const balance = this.contact().balance;
    if (balance > 0) return '#2dd36f';
    if (balance < 0) return '#eb445a';
    return '#666';
  });

  readonly balanceColor = computed(() => {
    const balance = this.contact().balance;
    if (balance > 0) return 'success';
    if (balance < 0) return 'danger';
    return 'warning';
  });

  scoreColor(): string {
    const s = this.contact().score || 0;
    if (s > 50) return '#4cd964';
    if (s >= 0) return '#ffd600';
    return '#ff3b30';
  }
}
