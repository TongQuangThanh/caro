import { AdMob, BannerAdPluginEvents, AdMobBannerSize, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { OverlayEventDetail } from '@ionic/core/components';
import { AlertController, IonModal, Platform } from '@ionic/angular';
import { LOCAL_LANG, SharedService, adBannerAndroid } from './shared.service';
import { Component, HostListener, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PluginListenerHandle } from '@capacitor/core';

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
    { title: this.translate.instant('sidebar.home'), url: '/home', icon: 'home' },
    { title: this.translate.instant('sidebar.about'), url: '/about', icon: 'information' },
  ];
  lang = this.sharedService.lang;
  @ViewChild(IonModal) modal: IonModal;
  listenerHandlers: PluginListenerHandle[] = [];
  constructor(private platform: Platform, private sharedService: SharedService, private alertController: AlertController, private translate: TranslateService) { }

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
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status === 'notDetermined') {
        const modal = await this.alertController.create({
          message: 'Please approve ads for maintain our service',
        });
        await modal.present();
        await modal.onDidDismiss();
      }
      await AdMob.initialize({
        // TODO
        // initializeForTesting: true,
        requestTrackingAuthorization: true
      });
      const resizeHandler = AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: AdMobBannerSize) => {
        const menu: HTMLElement = document.querySelector('ion-menu');
        const app: HTMLElement = document.querySelector('ion-router-outlet');
        if (info.height === 0) {
          app.style.marginBottom = '';
          menu.style.marginBottom = '';
          return;
        }
        if (info.height > 0) {
          const body = document.querySelector('body');
          const bodyStyles = window.getComputedStyle(body);
          const safeAreaBottom = bodyStyles.getPropertyValue('--ion-safe-area-top');
          app.style.marginBottom = `calc(${safeAreaBottom} + ${info.height}px)`;
          menu.style.marginBottom = `calc(${safeAreaBottom} + ${info.height}px)`;
          // this.addAdClass();
          // this.reCalculateCell();
        }
      });
      this.listenerHandlers.push(resizeHandler);
      const adId = 'ca-app-pub-3940256099942544/2934735716' || adBannerAndroid; // 'ca-app-pub-3940256099942544/2934735716';
      const options: BannerAdOptions = {
        adId,
        // TODO
        // isTesting: true,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.TOP_CENTER,
        margin: 0
      };
      await AdMob.showBanner(options);
    });
  }

  onClick(action: string) {
    if (action === 'Exit') {
      this.sharedService.exitApp();
    }
  }
}
