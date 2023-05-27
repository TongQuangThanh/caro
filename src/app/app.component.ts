import { AdMob, BannerAdPluginEvents, AdMobBannerSize, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { OverlayEventDetail } from '@ionic/core/components';
import { AlertController, IonModal, Platform } from '@ionic/angular';
import { LOCAL_LANG, SharedService, adBannerAndroid } from './shared.service';
import { Component, HostListener, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PluginListenerHandle } from '@capacitor/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  tooNarrow = false;
  width = 220;
  appMargin = 0;
  public action = [{ title: 'sidebar.exit', icon: 'exit', action: 'exit' }];
  public appPages = [
    { title: 'sidebar.home', url: '/home', icon: 'home' },
    { title: 'sidebar.about', url: '/about', icon: 'information' },
  ];
  lang = localStorage.getItem(LOCAL_LANG) || this.sharedService.lang;
  @ViewChild(IonModal) modal: IonModal;
  listenerHandlers: PluginListenerHandle[] = [];
  constructor(private platform: Platform, private sharedService: SharedService, private alertController: AlertController, private translate: TranslateService, private router: Router) {
    this.translate.use(this.lang);
    this.initializeAdMob();
    router.events.subscribe(data => {
      if (data instanceof NavigationEnd) {
        this.calculateMargin(this.appMargin);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.tooNarrow = event.target.innerHeight < 1.5 * this.width || event.target.innerWidth < this.width ? true : false;
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      this.translate.use(this.lang);
      localStorage.setItem(LOCAL_LANG, this.lang);
      this.sharedService.lang = this.lang;
    }
  }

  changeLang(e: any) {
    this.lang = e.detail.value;
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal.dismiss(null, 'confirm');
  }

  ionViewWillLeave() {
    this.listenerHandlers.forEach(handler => handler.remove());
  }

  initializeAdMob() {
    this.platform.ready().then(async () => {
      await AdMob.trackingAuthorizationStatus();
      await AdMob.initialize({
        // TODO
        // initializeForTesting: true,
        requestTrackingAuthorization: true
      });
      const resizeHandler = AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: AdMobBannerSize) => this.calculateMargin(info.height));
      this.listenerHandlers.push(resizeHandler);
      const adId = adBannerAndroid || 'ca-app-pub-3940256099942544/2934735716';
      const options: BannerAdOptions = {
        adId,
        // TODO
        // isTesting: true,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      };
      AdMob.showBanner(options);
    });
  }

  private calculateMargin(height: number) {
    const menu: HTMLElement = document.querySelector('ion-menu');
    const app: HTMLElement = document.querySelector('ion-router-outlet');
    this.appMargin = height;
    if (this.appMargin === 0) {
      app.style.marginBottom = '';
      menu.style.marginBottom = '';
      return;
    }
    if (this.appMargin > 0) {
      const body = document.querySelector('body');
      const bodyStyles = window.getComputedStyle(body);
      const safeAreaBottom = bodyStyles.getPropertyValue('--ion-safe-area-bottom');
      app.style.marginBottom = `calc(${safeAreaBottom} + ${this.appMargin}px)`;
      menu.style.marginBottom = `calc(${safeAreaBottom} + ${this.appMargin}px)`;
    }
  }

  onClick(action: string) {
    if (action === 'exit') {
      this.sharedService.exitApp();
    }
  }
}
