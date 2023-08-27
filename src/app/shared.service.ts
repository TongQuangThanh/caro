import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export const adBannerAndroid = 'ca-app-pub-1861772573153532/7275384351';
export const adVideoAndroid = 'ca-app-pub-1861772573153532/5283594843';
export const LOCAL = 'thnvn_caro';
export const LOCAL_LANG = LOCAL + '_lang';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public lang = localStorage.getItem(LOCAL_LANG) || 'en';
  public exit = new Subject<string>(); // Observable string sources
  exit$ = this.exit.asObservable(); // Observable string streams
  constructor() { }
  exitApp() {
    this.exit.next('');
  }
}
