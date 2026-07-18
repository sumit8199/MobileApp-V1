import { Component, computed, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent  implements OnInit {
  readonly initials = input<string>();
  readonly size = input<number>(100);
  
  public fontSize = computed(() => this.size() * 0.34);
  public backgroundColor = "#D4AF37";
  
  constructor() { }

  ngOnInit() {}


  // get initials(): string {
  //   return this.getInitials(this.patient?.name || '');
  // }

  // get backgroundColor(): string {
  //   return this.getAvatarColor(this.patient?.id ?? 0);
  // }

  // private getInitials(name: string): string {
  //   return name
  //     .trim()
  //     .split(' ')
  //     .map(word => word.charAt(0))
  //     .slice(0, 2)
  //     .join('')
  //     .toUpperCase();
  // }

  // private getAvatarColor(id: number): string {
  //   const colors = [
  //     '#4CAF50',
  //     '#2196F3',
  //     '#FF9800',
  //     '#9C27B0',
  //     '#009688',
  //     '#F44336',
  //     '#3F51B5',
  //     '#795548',
  //     '#607D8B',
  //     '#E91E63'
  //   ];

  //   return colors[id % colors.length];
  // }
}
