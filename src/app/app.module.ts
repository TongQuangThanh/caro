import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { PlayComponent } from './play/play.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AboutComponent } from './about/about.component';
import { HomeComponent, ModalComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { url } from './shared.service';

const config: SocketIoConfig = { url: url, options: {} };
@NgModule({
    declarations: [AppComponent, HomeComponent, AboutComponent, PlayComponent, ModalComponent],
    imports: [FormsModule, BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, SharedModule, SocketIoModule.forRoot(config)],
    providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
    bootstrap: [AppComponent]
})
export class AppModule {}
