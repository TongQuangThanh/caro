import { SharedService } from './../shared.service';
import { IonRouterOutlet, ModalController, Platform, AlertController, AlertInput, ToastController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './../storage.service';
import { App } from '@capacitor/app';
import { TranslateService } from '@ngx-translate/core';
import { Share } from '@capacitor/share';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  maxSize = 15;
  minSize = 3;
  choose1 = 'o';
  choose2 = '×';
  chainToWin = 5;
  isOnePlayer: 'false' | 'true' | 'onl' = 'onl';
  player = '1';
  size = 10;
  color1 = 'danger';
  color2 = 'primary';
  confrontation = true;
  showRoom = false;
  joinMode = false;
  room = ''; // RYYMMDDHHMMSS
  selectedRoom = '';
  chooses = ['o', '×', '+', '-', '☆', '☼', '☽', '♂', '♀', '😋', '🙄'];
  colors = [
    { title: 'primary', colorName: 'blue' },
    { title: 'secondary', colorName: 'light blue' },
    { title: 'tertiary', colorName: 'violet' },
    { title: 'success', colorName: 'green' },
    { title: 'warning', colorName: 'yellow' },
    { title: 'danger', colorName: 'red' },
    { title: 'medium', colorName: 'gray' },
  ];
  constructor(private storage: StorageService, private router: Router, private modalController: ModalController,
    private routerOutlet: IonRouterOutlet, private platform: Platform, private alertController: AlertController, private socket: Socket,
    private sharedService: SharedService, private toastController: ToastController, private translate: TranslateService) {
    this.platform.backButton.subscribeWithPriority(-1, () => this.exitApp());
    sharedService.exit$.subscribe(() => this.exitApp());
  }

  ngOnInit() { }

  async toast() {
    const toast = await this.toastController.create({
      header: this.translate.instant('notify.duplicate.title'),
      message: this.translate.instant('notify.duplicate.message'),
      position: 'top',
      cssClass: 'ion-text-center',
      duration: 1500
    });
    toast.present();
  }

  async alertText(player: number, value?: string) {
    const alertText = await this.alertController.create({
      header: this.translate.instant('home.alert.title'),
      inputs: [{
        name: '',
        value,
        type: 'text',
        attributes: {
          maxLength: 1,
          minLength: 1,
          autoComplete: 'false',
          autoCorrect: 'false',
          onKeyUp: (key: any) => {
            if ((player === 1 && key.key === this.choose2) || (player === 2 && key.key === this.choose1)) {
              key.target.value = '';
              this.toast();
            }
          }
        },
        placeholder: this.translate.instant('home.alert.message')
      }],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        }, {
          text: 'OK',
          handler: (val) => {
            if (!val[0] || (player === 1 && val[0] === this.choose2) || (player === 2 && val[0] === this.choose1)) {
              return false;
            } else if (player === 1) {
              this.choose1 = val[0];
            } else {
              this.choose2 = val[0];
            }
          }
        }
      ]
    });
    alertText.present();
  }

  async chooseSymbol(player: number, playerName: string, otherName: string) {
    let currentSymbol: string; let otherSymbol: string;
    const name = `(${otherName.replace(' symbol', ')').replace('Your', 'Player')}`;
    if (player === 1) {
      currentSymbol = this.choose1;
      otherSymbol = this.choose2;
    } else {
      currentSymbol = this.choose2;
      otherSymbol = this.choose1;
    }
    const inputs: AlertInput[] = this.chooses.map((value) => ({
      type: 'radio',
      label: `${value} ${value === otherSymbol ? name : ''}`,
      value,
      checked: value === currentSymbol,
      disabled: value === otherSymbol
    }));
    inputs.push({
      type: 'radio',
      label: this.translate.instant('home.custom-symbol'),
      checked: !this.chooses.includes(currentSymbol),
      handler: () => this.alertText(player, currentSymbol)
    });
    const alert = await this.alertController.create({
      header: `${this.translate.instant('common.choose')} ${playerName}`,
      inputs,
      buttons: [
        {
          text: this.translate.instant('common.close'),
          role: 'cancel'
        }, {
          text: this.translate.instant('common.change'),
          handler: () => {
            this.alertController.dismiss().then(() => {
              this.chooseColor(player, playerName);
            });
          }
        }, {
          text: 'OK',
          handler: (value) => {
            if (value && player === 1) { this.choose1 = value; } else if (value) { this.choose2 = value; }
          }
        }
      ]
    });
    alert.present();
  }

  async chooseColor(player: number, playerName: string) {
    const currentColor = player === 1 ? this.color1 : this.color2;
    const inputs: AlertInput[] = this.colors.map((value) => ({
      type: 'radio',
      label: value.colorName,
      value: value.title,
      checked: value.title === currentColor,
      handler: () => {
        if (player === 1) { this.color1 = value.title; } else { this.color2 = value.title; }
        this.alertController.dismiss();
      }
    }));
    const alert = await this.alertController.create({
      header: `Choose ${playerName.replace('symbol', 'color')}`,
      inputs,
      buttons: [
        {
          text: this.translate.instant('common.close'),
          role: 'cancel'
        }, {
          text: 'OK'
        }
      ]
    });
    alert.present();
  }

  exitApp() {
    if (!this.routerOutlet.canGoBack()) {
      this.alertController.create({
        header: this.translate.instant('notify.quit.title'),
        message: this.translate.instant('notify.quit.message'),
        buttons: [
          {
            text: this.translate.instant('common.close'),
            role: 'cancel'
          }, {
            text: 'OK',
            handler: () => {
              App.exitApp();
            }
          }
        ]
      }).then((alert) => alert.present());
    }
  }

  changeChainToWin() {
    this.size = this.size > this.maxSize ? this.maxSize : this.size < this.minSize ? this.minSize : this.size;
    this.chainToWin = this.size > 5 ? 5 : 3;
  }

  async modeInfo() {
    const modal = await this.modalController.create({
      component: ModalComponent,
      showBackdrop: true,
      backdropDismiss: true
    });
    modal.present();
  }

  onPlayerChange() {
    if (this.isOnePlayer === 'onl') {
      this.confrontation = false;
    }
  }

  async share() {
    // Share text only
    await Share.share({
      text: this.room,
    });
  }

  join() {
    if (!this.selectedRoom) {
      return;
    }
    this.joinMode = true;
  }

  async onSubmit() {
    const p1 = this.storage.set('size', this.size);
    const p2 = this.storage.set('choose1', this.choose1);
    const p3 = this.storage.set('choose2', this.choose2);
    const p4 = this.storage.set('chainToWin', this.chainToWin);
    const p5 = this.storage.set('isOnePlayer', this.isOnePlayer);
    const p6 = this.storage.set('confrontation', this.confrontation);
    const p7 = this.storage.set('color1', this.color1);
    const p8 = this.storage.set('color2', this.color2);
    if (this.joinMode) {
      Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then(() => this.router.navigateByUrl('play'));
    } else {
      if (this.isOnePlayer === 'onl') {
        this.showRoom = true;
        const now = new Date();
        this.room = `R${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        console.log(this.room);
        this.socket.fromEvent('join-room').subscribe(x => {
          console.log(248, x);
          Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then(() => this.router.navigateByUrl('play'));
        });
        this.socket.emit('create-room', this.room);
      } else {
        Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then(() => this.router.navigateByUrl('play'));
      }
    }
  }
}

@Component({
  selector: 'app-modal',
  template: `<ion-header [translucent]="true">
              <ion-toolbar>
                <ion-title>{{ 'home.confront-mode' | translate }}</ion-title>
                <ion-buttons slot="end">
                  <ion-button (click)="dismiss()" expand="block" fill="clear" shape="round">{{ 'common.close' | translate }}</ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-grid fixed>
                <ion-row>
                  <ion-col>
                    <ion-text>
                      <p>{{ 'home.confront.text' | translate }}</p>
                    </ion-text>
                    <ion-img style="max-height: 75vh;" src="../../assets/img/confrontation.png"></ion-img>
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
