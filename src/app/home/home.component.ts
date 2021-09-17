import { SharedService } from './../shared.service';
import { IonRouterOutlet, ModalController, Platform, AlertController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './../storage.service';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  maxSize = 20;
  minSize = 3;
  choose = 'o';
  chainToWin = 5;
  isOnePlayer = 'true';
  player = '1';
  size = 10;
  confrontation = true;
  constructor(private storage: StorageService, private router: Router, private modalController: ModalController,
    private routerOutlet: IonRouterOutlet, private platform: Platform, private alertController: AlertController,
    private sharedService: SharedService) {
    this.platform.backButton.subscribeWithPriority(-1, () => this.exitApp());
    sharedService.exit$.subscribe(() => this.exitApp());
  }

  ngOnInit() { }

  exitApp() {
    if (!this.routerOutlet.canGoBack()) {
      this.alertController.create({
        header: 'Quit this game!',
        message: 'Do you really want to quit this game?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          }, {
            text: 'Exit',
            handler: () => {
              App.exitApp();
            }
          }
        ]
      }).then((alert) => alert.present());
    }
  }

  changeChainToWin() {
    this.chainToWin = this.size > 5 ? 5 : 3;
  }

  async modeInfo() {
    const modal = await this.modalController.create({
      component: ModalComponent,
      showBackdrop: true,
      swipeToClose: true,
      backdropDismiss: true
    });
    await modal.present();
  }

  async onSubmit() {
    const p1 = this.storage.set('size', this.size);
    const p2 = this.storage.set('choose', this.choose);
    const p3 = this.storage.set('chainToWin', this.chainToWin);
    const p4 = this.storage.set('isOnePlayer', this.isOnePlayer === 'true' ? true : false);
    const p5 = this.storage.set('confrontation', this.confrontation);
    Promise.all([p1, p2, p3, p4, p5]).then(() => this.router.navigateByUrl('play'));
  }
}

@Component({
  selector: 'app-modal',
  template: `<ion-header [translucent]="true">
              <ion-toolbar>
                <ion-title>Confrontation mode</ion-title>
                <ion-buttons slot="end">
                  <ion-button (click)="dismiss()" expand="block" fill="clear" shape="round">Close</ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-grid fixed>
                <ion-row>
                  <ion-col>
                    <ion-text>
                      <p>It allow rotate 1 side for more comfortable when you play with your friend :)</p>
                    </ion-text>
                    <ion-img style="height: 80vh;" src="../../assets/img/confrontation.png"></ion-img>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-content>`,
})
export class ModalComponent implements OnInit {
  constructor(private modalController: ModalController) { }

  ngOnInit() { }

  dismiss() {
    this.modalController.dismiss(); // using injected ModalController this page can "dismiss" itself, pass back data
  }
}
