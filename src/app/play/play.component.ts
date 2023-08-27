import { StorageService } from './../storage.service';
import { AfterViewChecked, Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, Platform } from '@ionic/angular';
import { AdMobRewardItem, AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { adVideoAndroid } from '../shared.service';

const MAP_SCORE_COMPUTER = new Map([
  [5, Infinity], [4, 2000], [3, 500], [2, 300], [1, 100]
]);
const MAP_POINT_HUMAN = new Map([
  [4, 999999], [3, 1000], [2, 400], [1, 10], [0, 0]
]);

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit, AfterViewChecked {

  yArr = ['']; // generate y-axis
  arr = [];
  size = 10;
  count = 0;
  count1stWin = 0;
  count2ndWin = 0;
  count1stMove = 0;
  count2ndMove = 0;
  best1stMove = 0;
  best2ndMove = 0;
  firstPlayer = 'o';
  secondPlayer = '×';
  chainToWin = 5;
  isWin = false;
  arrWin = [];
  cellWidth: number;
  isOnePlayer = true;
  previous1st = []; // [i, j]
  previous2nd = [];
  isDraw = false;
  disableUndo = false;
  confrontation = true;
  color1 = 'danger';
  color2 = 'primary';
  horizontal = [[-1, 0], [1, 0]];    // T, D
  vertical = [[0, -1], [0, 1]];    // B, N
  inclineDown = [[-1, -1], [1, 1]];  // TB DN
  inclineUp = [[-1, 1], [1, -1]];   // TN, DB
  direction = [this.horizontal, this.vertical, this.inclineDown, this.inclineUp];
  directionName = ['horizontal', 'vertical', 'inclineDown', 'inclineUp'];
  desktopMode = ['electron', 'desktop', 'pwa'];
  isDesktop = false;

  constructor(private storage: StorageService, private alertController: AlertController, private platform: Platform, private translate: TranslateService) {
    AdMob.addListener(RewardAdPluginEvents.Rewarded, _ => this.onUndo());
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.ngAfterViewChecked();
  }

  async ngOnInit() {
    // if (!this.platform.is('ios') && !this.platform.is('android')) {
    //   this.isDesktop = true;
    // }
    const p1 = +this.storage.get('size');
    const p2 = +this.storage.get('chainToWin');
    const p3 = this.storage.get('choose1');
    const p4 = this.storage.get('choose2');
    const p5 = this.storage.get('color1');
    const p6 = this.storage.get('color2');
    const p7 = this.storage.get('isOnePlayer') === 'true';
    const p8 = this.storage.get('confrontation') === 'true';
    Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then((value) => {
      [this.size, this.chainToWin, this.firstPlayer, this.secondPlayer,
      this.color1, this.color2, this.isOnePlayer, this.confrontation] = value;
      this.createBoard();
      this.ngAfterViewChecked();
    });
  }

  ngAfterViewChecked() {
    const cells = document.getElementsByClassName('cell');
    const clientWidth = document.body.clientWidth;
    this.cellWidth = document.body.clientWidth > 320 ? 25 : 20;
    if (clientWidth / this.size < this.cellWidth) {
      this.cellWidth = Math.round(clientWidth / this.size - 1);
    }
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < cells.length; i++) {
      const element = cells[i] as HTMLElement;
      element.style.width = this.cellWidth + 'px';
      element.style.height = this.cellWidth + 'px';
    }
  }

  public isDisabled(): boolean {
    return this.disableUndo || this.count1stMove <= 0 || this.count % 2 === 1;
  }

  async reset() {
    const alert = await this.alertController.create({
      header: this.translate.instant('notify.reset.title'),
      message: this.translate.instant('notify.reset.message'),
      buttons: [
        {
          text: this.translate.instant('common.close'),
          role: 'cancel'
        }, {
          text: 'OK',
          handler: () => {
            this.createBoard(true);
          }
        }
      ]
    });
    alert.present();
  }

  createBoard(clickReset?: boolean) {
    this.isWin = false;
    this.isDraw = false;
    this.arr = [];
    this.arrWin = [];
    this.count = 0;
    this.best1stMove = !clickReset && this.count1stMove < this.best1stMove ? this.count1stMove : this.best1stMove;
    this.best2ndMove = !clickReset && this.count2ndMove < this.best2ndMove ? this.count2ndMove : this.best2ndMove;
    this.count1stMove = 0;
    this.count2ndMove = 0;
    for (let i = 0; i < this.size; i++) {
      const a = [];
      for (let j = 0; j < this.size; j++) {
        a.push('');
      }
      this.arr.push(a);
    }
  }

  checkContain(i: number, j: number) {
    let isExist = false;
    this.arrWin.forEach(element => {
      if (i === element[0] && j === element[1]) { isExist = true; }
    });
    return isExist;
  }

  checkWin(i: number, j: number, currentPlayer: string) {
    for (const direction of this.direction) {
      this.arrWin = [];
      const [toLeft, toRight] = direction; // example: direction[l] = horizontal = [[-1, 0], [1, 0]]
      const [xLeft, yLeft] = toLeft; // example: toLeft = horizontal[0] = [-1, 0]
      const [xRight, yRight] = toRight; // example: toRight = horizontal[1] = [1, 0]
      this.arrWin.push([i, j]);
      if (this.arr[i + xLeft] !== undefined && this.arr[i + xLeft][j + yLeft] === currentPlayer) {
        let aLeft = i + xLeft;
        let bLeft = j + yLeft;
        while (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === currentPlayer) {
          this.arrWin.push([aLeft, bLeft]);
          aLeft += xLeft;
          bLeft += yLeft;
        }
      }
      if (this.arr[i + xRight] !== undefined && this.arr[i + xRight][j + yRight] === currentPlayer) {
        let aRight = i + xRight;
        let bRight = j + yRight;
        while (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === currentPlayer) {
          this.arrWin.push([aRight, bRight]);
          aRight += xRight;
          bRight += yRight;
        }
      }
      if (this.arrWin.length >= this.chainToWin) {
        this.arrWin = this.arrWin.sort(); // sorted to know direction of line
        if (currentPlayer === this.firstPlayer) {
          this.count1stWin++;
          if (this.count1stWin === 1) {
            this.best1stMove = this.count1stMove;
          }
        } else {
          this.count2ndWin++;
          if (this.count2ndWin === 1) {
            this.best2ndMove = this.count2ndMove;
          }
        }
        this.isWin = true;
        setTimeout(() => {
          const isVertical = this.arrWin.every(e => e[0] === i);
          const isHorizontal = this.arrWin.every(e => e[1] === j);
          // element decrease
          const inclineUp = this.arrWin.every((e, idx, arr) => arr[idx + 1] ? e[0] < arr[idx + 1][0] && e[1] > arr[idx + 1][1] : true);
          this.arrWin.forEach((element) => {
            const div = document.getElementById(`${element[0]}-${element[1]}`);
            div.style.color = 'green';
            div.style.border = 'green';
            const divLine = document.getElementById(`line-${element[0]}-${element[1]}`);
            if (isVertical) { // vertical
              divLine.classList.add('vertical');
              divLine.style.width = this.cellWidth + 'px';
            } else if (isHorizontal) { // horizontal
              divLine.style.width = this.cellWidth + 'px';
            } else if (inclineUp) {
              divLine.style.width = this.cellWidth * Math.sqrt(2) + 'px';
              divLine.classList.add('incline-up');
            } else {
              divLine.style.width = this.cellWidth * Math.sqrt(2) + 'px';
              divLine.classList.add('incline-down');
            }
          });
          setTimeout(() => this.createBoard(), 500);
        });
        break;
      }
    }
    return this.isWin;
  }

  async undo() {
    const alert = await this.alertController.create({
      header: this.translate.instant('notify.undo.title'),
      message: this.translate.instant('notify.undo.message'),
      buttons: [
        {
          text: this.translate.instant('common.close'),
          role: 'cancel'
        }, {
          text: 'OK',
          handler: () => this.showAd(),
        }
      ]
    });
    alert.present();
  }

  async showAd(): Promise<AdMobRewardItem> {
    try {
      // TODO
      const adId = adVideoAndroid;
      // const adId = 'ca-app-pub-3940256099942544/5224354917';
      await AdMob.prepareRewardVideoAd({ adId });
      return await AdMob.showRewardVideoAd();
    } catch (error) {
      return { type: 'false', amount: 0 };
    }
  }

  private onUndo() {
    this.disableUndo = true;
    if (this.isOnePlayer) {
      this.count -= 2;
      this.count1stMove--;
      this.count2ndMove--;
      this.arr[this.previous1st[0]][this.previous1st[1]] = '';
      this.arr[this.previous2nd[0]][this.previous2nd[1]] = '';
    } else {
      this.count--;
      if (this.count1stMove > this.count2ndMove) { //1st just click
        this.count1stMove--;
        this.arr[this.previous1st[0]][this.previous1st[1]] = '';
      } else {
        this.count2ndMove--;
        this.arr[this.previous2nd[0]][this.previous2nd[1]] = '';
      }
    }
  }

  computerTick(x: number, y: number) {
    this.arr[x][y] = this.secondPlayer;
    this.previous2nd = [x, y];
  }

  tick(i: number, j: number) {
    if (this.arr[i][j] === '' && !this.isWin) {
      this.disableUndo = false;
      this.count++;
      let currentPlayer;
      if (this.count % 2 === 1) {
        this.count1stMove++;
        this.arr[i][j] = this.firstPlayer;
        currentPlayer = this.firstPlayer;
        this.previous1st = [i, j];
        if (this.checkWin(i, j, currentPlayer)) {
          return false;
        }
        if (this.isOnePlayer) {  // computer
          this.count2ndMove++;
          currentPlayer = this.secondPlayer;
          this.count++;
          const comPoint = this.getPointsComputer();
          i = comPoint[0];
          j = comPoint[1];
          this.arr[i][j] = this.secondPlayer;
        }
      } else if (!this.isOnePlayer) {                        // 2nd player
        currentPlayer = this.secondPlayer;
        this.count2ndMove++;
        this.arr[i][j] = this.secondPlayer;
        this.previous2nd = [i, j];
      }
      if (this.count1stMove >= this.chainToWin || this.count2ndMove >= this.chainToWin) {
        this.checkWin(i, j, currentPlayer);
      }
      if (this.count === this.size ** 2) {
        this.isDraw = true;
        setTimeout(() => this.createBoard(), 500);
      }
    }
  }

  getPointsComputer() {
    let maxScore = -Infinity;
    let pointsComputer = [];
    let listScorePoint = [];
    for (let i = 0; i < this.arr.length; i++) {
      for (let j = 0; j < this.arr[0].length; j++) {
        if (this.arr[i][j] === "") {
          let score =
            MAP_SCORE_COMPUTER.get(
              Math.max(
                this.getHorizontal(i, j, this.secondPlayer),
                this.getVertical(i, j, this.secondPlayer),
                this.getRightDiagonal(i, j, this.secondPlayer),
                this.getLeftDiagonal(i, j, this.secondPlayer)
              )
            ) +
            MAP_POINT_HUMAN.get(
              Math.max(
                this.getHorizontal(i, j, this.firstPlayer),
                this.getVertical(i, j, this.firstPlayer),
                this.getRightDiagonal(i, j, this.firstPlayer),
                this.getLeftDiagonal(i, j, this.firstPlayer)
              ) - 1
            );
          if (maxScore <= score) {
            maxScore = score;
            listScorePoint.push({
              score: score,
              point: [i, j],
            });
          }
        }
      }
    }

    // get list max score
    for (const element of listScorePoint) {
      if (element.score === maxScore) {
        pointsComputer.push(element.point);
      }
    }
    return pointsComputer[Math.floor(Math.random() * pointsComputer.length)];
  }

  getHorizontal(x: number, y: number, player: string) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (y + i < this.arr[0].length && this.arr[x][y + i] === player) {
        count++;
      } else {
        break;
      }
    }

    for (let i = 1; i < 5; i++) {
      if (
        y - i >= 0 &&
        y - i < this.arr[0].length &&
        this.arr[x][y - i] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  getVertical(x: number, y: number, player: string) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (x + i < this.arr.length && this.arr[x + i][y] === player) {
        count++;
      } else {
        break;
      }
    }

    for (let i = 1; i < 5; i++) {
      if (
        x - i >= 0 &&
        x - i < this.arr.length &&
        this.arr[x - i][y] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  getRightDiagonal(x: number, y: number, player: string) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (
        x - i >= 0 &&
        x - i < this.arr.length &&
        y + i < this.arr[0].length &&
        this.arr[x - i][y + i] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    for (let i = 1; i < 5; i++) {
      if (
        x + i < this.arr.length &&
        y - i >= 0 &&
        y - i < this.arr[0].length &&
        this.arr[x + i][y - i] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  getLeftDiagonal(x: number, y: number, player: string) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      if (
        x - i >= 0 &&
        x - i < this.arr.length &&
        y - i >= 0 &&
        y - i < this.arr[0].length &&
        this.arr[x - i][y - i] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    for (let i = 1; i < 5; i++) {
      if (
        x + i < this.arr.length &&
        y + i < this.arr[0].length &&
        this.arr[x + i][y + i] === player
      ) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
