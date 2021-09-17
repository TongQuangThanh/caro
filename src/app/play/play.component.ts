import { StorageService } from './../storage.service';
import { AfterViewChecked, Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';

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

  constructor(private storage: StorageService, private router: Router,
    private alertController: AlertController, private platform: Platform) { }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.ngAfterViewChecked();
  }

  async ngOnInit() {
    if (!this.platform.is('ios') && !this.platform.is('android')) {
      this.isDesktop = true;
    }
    const p1 = this.storage.get('size');
    const p2 = this.storage.get('chainToWin');
    const p3 = this.storage.get('choose1');
    const p4 = this.storage.get('choose2');
    const p5 = this.storage.get('color1');
    const p6 = this.storage.get('color2');
    const p7 = this.storage.get('isOnePlayer');
    const p8 = this.storage.get('confrontation');
    Promise.all([p1, p2, p3, p4, p5, p6, p7, p8]).then((value) => {
      [this.size, this.chainToWin, this.firstPlayer, this.secondPlayer,
        this.color1, this.color2, this.confrontation, this.isOnePlayer] = value;
        console.log([this.size, this.chainToWin, this.firstPlayer, this.secondPlayer,
          this.color1, this.color2, this.confrontation, this.isOnePlayer]);

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

  async reset() {
    const alert = await this.alertController.create({
      header: 'Reset all board!',
      message: 'Are you sure?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        }, {
          text: 'OK',
          handler: () => {
            this.createBoard(true);
          }
        }
      ]
    });
    await alert.present();
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
      if ([i, j] === element) { isExist = true; }
    });
    return isExist;
  }

  computerLastTickThenWin(a: number, b: number, currentPlayer: string) {
    this.arr[a][b] = this.secondPlayer;
    this.isWin = true;
    this.checkWin(a, b, currentPlayer);
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

  undo() {
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
          const user = this.firstPlayer;
          this.count++;
          let pieceOfPlayer = [];
          // check if computer can win by this tick by 4 piece on line
          if (this.count2ndMove >= this.chainToWin) {
            const arrOfCom = [];
            this.arr.forEach((element, m) => element.forEach((e: string, n: number) => e === currentPlayer ? arrOfCom.push([m, n]) : ''));
            outerLoop:
            for (const element of arrOfCom) {
              for (const direction of this.direction) {
                const [toLeft, toRight] = direction; // example: direction[l] = horizontal = [[-1, 0], [1, 0]]
                const [xLeft, yLeft] = toLeft; // example: toLeft = horizontal[0] = [-1, 0]
                const [xRight, yRight] = toRight; // example: toRight = horizontal[1] = [1, 0]
                const [x, y] = element;
                let countLeftRight = 0;
                if (this.arr[x + xLeft] !== undefined && this.arr[x + xLeft][y + yLeft] === currentPlayer) {
                  let c = 1; // x, y is first, then count up
                  let aLeft = x + xLeft;
                  let bLeft = y + yLeft;
                  while (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === currentPlayer) {
                    c++;
                    countLeftRight++;
                    aLeft += xLeft;
                    bLeft += yLeft;
                  }
                  this.previous2nd = [aLeft, bLeft];
                  if (c >= this.chainToWin - 1) { // this.chainToWin = 5 => if c == 4 so computer tick and win
                    this.computerLastTickThenWin(aLeft, bLeft, currentPlayer);
                    break outerLoop;
                  }
                  // else not enough chainToWin - 1 but maybe it is o o _ o o
                  if (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === '' &&
                    this.arr[aLeft + xLeft] !== undefined && this.arr[aLeft + xLeft][bLeft + yLeft] === currentPlayer) {
                    aLeft += xLeft;
                    bLeft += yLeft;
                    while (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === currentPlayer) {
                      c++;
                      aLeft += xLeft;
                      bLeft += yLeft;
                    }
                  }
                  if (c >= this.chainToWin - 1) {
                    this.computerLastTickThenWin(this.previous2nd[0], this.previous2nd[1], currentPlayer);
                    break outerLoop;
                  }
                }
                if (this.arr[x + xRight] !== undefined && this.arr[x + xRight][y + yRight] === currentPlayer) {
                  let c = 1; // x, y is first, then count up
                  let aRight = x + xRight;
                  let bRight = y + yRight;
                  while (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === currentPlayer) {
                    c++;
                    countLeftRight++;
                    aRight += xRight;
                    bRight += yRight;
                  }
                  this.previous2nd = [aRight, bRight];
                  if (c >= this.chainToWin - 1) { // this.chainToWin = 5 => if c == 4 so computer tick and win
                    this.computerLastTickThenWin(aRight, bRight, currentPlayer);
                    break outerLoop;
                  }
                  // else not enough chainToWin - 1 but maybe it is o o _ o o
                  if (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === '' &&
                    this.arr[aRight + xRight] !== undefined && this.arr[aRight + xRight][bRight + yRight] === currentPlayer) {
                    aRight += xRight;
                    bRight += yRight;
                    while (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === currentPlayer) {
                      c++;
                      aRight += xRight;
                      bRight += yRight;
                    }
                  }
                  if (c >= this.chainToWin - 1) {
                    this.computerLastTickThenWin(this.previous2nd[0], this.previous2nd[1], currentPlayer);
                    break outerLoop;
                  }
                }
                if (countLeftRight >= this.chainToWin - 1) {
                  this.computerLastTickThenWin(x, y, currentPlayer);
                  break outerLoop;
                }
              }
            }
          }
          // or keep playing by count max piece foreach direction of player's click above and choose longest of player's line to intercept
          if (!this.isWin) {
            for (const direction of this.direction) {
              const [toLeft, toRight] = direction; // example: direction[l] = horizontal = [[-1, 0], [1, 0]]
              const [xLeft, yLeft] = toLeft; // example: toLeft = horizontal[0] = [-1, 0]
              const [xRight, yRight] = toRight; // example: toRight = horizontal[1] = [1, 0]
              let count1 = 0;
              if (this.arr[i + xLeft] !== undefined && this.arr[i + xLeft][j + yLeft] === user) {
                let aLeft = i + xLeft;
                let bLeft = j + yLeft;
                while (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === user) {
                  count1++;
                  aLeft += xLeft;
                  bLeft += yLeft;
                }
              } else if (this.arr[i + xLeft] !== undefined && this.arr[i + xLeft][j + yLeft] === '' &&
                this.arr[i + 2 * xLeft] !== undefined && this.arr[i + 2 * xLeft][j + 2 * yLeft] === user) {
                let aLeft = i + 2 * xLeft;
                let bLeft = j + 2 * yLeft;
                while (this.arr[aLeft] !== undefined && this.arr[aLeft][bLeft] === user) {
                  count1++;
                  aLeft += xLeft;
                  bLeft += yLeft;
                }
              }
              let count2 = 0;
              if (this.arr[i + xRight] !== undefined && this.arr[i + xRight][j + yRight] === user) {
                let aRight = i + xRight;
                let bRight = j + yRight;
                while (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === user) {
                  count2++;
                  aRight += xRight;
                  bRight += yRight;
                }
              } else if (this.arr[i + xRight] !== undefined && this.arr[i + xRight][j + yRight] === '' &&
                this.arr[i + 2 * xRight] !== undefined && this.arr[i + 2 * xRight][j + 2 * yRight] === user) {
                let aRight = i + 2 * xRight;
                let bRight = j + 2 * yRight;
                while (this.arr[aRight] !== undefined && this.arr[aRight][bRight] === user) {
                  count2++;
                  aRight += xRight;
                  bRight += yRight;
                }
              }
              pieceOfPlayer.push([count1, count2]);
            }
            pieceOfPlayer = pieceOfPlayer.map((e, idx) => [e, this.directionName[idx]])
              .sort((a, b) => (b[0][0] + b[0][1]) - (a[0][0] + a[0][1]));
            loopWhenComputerTick: // let computer tick
            for (let o = 0; o < pieceOfPlayer.length; o++) { // loop throw 4 direction of user tick, tick on longest
              const element = pieceOfPlayer[o];
              const dirToCheck = element[1];
              const idx = this.directionName.indexOf(dirToCheck);
              const [toLeft, toRight] = this.direction[idx];
              const [xLeft, yLeft] = toLeft; // example: toLeft = horizontal[0] = [-1, 0]
              const [xRight, yRight] = toRight; // example: toRight = horizontal[1] = [1, 0]
              if (element[0][0] + element[0][1] >= this.chainToWin - 2) { // fill on hole
                const dirId = this.directionName.indexOf(element[1]);
                const [toLeftHole, toRightHole] = this.direction[dirId]; // example: direction[l] = horizontal = [[-1, 0], [1, 0]]
                const [xLeftHole, yLeftHole] = toLeftHole; // example: toLeft = horizontal[0] = [-1, 0]
                const [xRightHole, yRightHole] = toRightHole; // example: toRight = horizontal[1] = [1, 0]
                if (this.arr[i + xLeftHole] !== undefined && this.arr[i + xLeftHole][j + yLeftHole] === '' &&
                  this.arr[i + 2 * xLeftHole] !== undefined && this.arr[i + 2 * xLeftHole][j + 2 * yLeftHole] === user) {
                  this.computerTick(i + xLeftHole, j + yLeftHole);
                  break;
                } else if (this.arr[i + xRightHole] !== undefined && this.arr[i + xRightHole][j + yRightHole] === '' &&
                  this.arr[i + 2 * xRightHole] !== undefined && this.arr[i + 2 * xRightHole][j + 2 * yRightHole] === user) {
                  this.computerTick(i + xRightHole, j + yRightHole);
                  break;
                }
              }
              if (o === pieceOfPlayer.length - 1) { // can decide ? let random
                let x = Math.floor(Math.random() * 10);
                let y = Math.floor(Math.random() * 10);
                while (this.arr[x][y] !== '') {
                  x = Math.floor(Math.random() * 10);
                  y = Math.floor(Math.random() * 10);
                }
                this.computerTick(x, y);
                break;
              }
              if (this.arr[i + xLeft] !== undefined && this.arr[i + xLeft][j + yLeft] === '') {
                this.computerTick(i + xLeft, j + yLeft);
                break;
              } else if (this.arr[i + xRight] !== undefined && this.arr[i + xRight][j + yRight] === '') {
                this.computerTick(i + xRight, j + yRight);
                break;
              } else {
                continue loopWhenComputerTick;
              }
            }
          }
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
}
