import { SharedService } from './shared.service';
import { Component, ContentChild, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  tooNarrow = false;
  width = 220;
  public action = [{ title: 'Exit', icon: 'exit' }];
  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'About', url: '/about', icon: 'information' },
  ];
  constructor(private sharedService: SharedService) { }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.tooNarrow = event.target.innerHeight < 1.5 * this.width || event.target.innerWidth < this.width ? true : false;
  }

  onClick(action: string) {
    if (action === 'Exit') {
      this.sharedService.exitApp();
    }
  }
}
