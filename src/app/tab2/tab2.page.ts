import {Component} from '@angular/core';
import {EMPTY, Observable} from 'rxjs';
import {PhotoService, UserPhoto} from '../services/photo.service';
import {switchMap} from "rxjs/operators";
import {ActionSheetController} from "@ionic/angular";
import {fromPromise} from "rxjs/internal-compatibility";
import {OverlayEventDetail} from "@ionic/core";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  // public photos: UserPhoto[] = [];
  private typeAction = {delete: 'delete', cancel: 'cancel'}

  constructor(private photoService: PhotoService,
              public actionSheetController: ActionSheetController) {
    // this.photos$.subscribe(photos => {
    //   // this.photos = photos;
    //   console.log(photos);
    // });
    this.photoService.loadSaved();
  }

  get photos$(): Observable<UserPhoto[]> {
    return this.photoService.photos$;
  }

  addPhotoToGallery(): void {
    this.photoService.getPhotoToGalleryOrCamera().pipe(
      switchMap((capturedPhoto) => this.photoService.savePicture(capturedPhoto)),
    )
      .subscribe(
        userPhoto => {
          this.photoService.addUserPhotoToGallery(userPhoto);
        },
        error => {
          console.log('error');
          console.log(error);
        });
  }


  private clickImageMenu$(): Observable<OverlayEventDetail> {
    return fromPromise(
      this.actionSheetController.create({
        header: 'Photos',
        buttons: [{
          text: 'Delete',
          role: 'cancel',
          icon: 'trash',
          data: {action: this.typeAction.delete}
        }, {
          text: 'Cancel',
          icon: 'close',
          role: 'destructive',
          data: {action: this.typeAction.cancel}
        }]
      }).then(menu => {
        return menu.present()
          .then(() => menu.onDidDismiss())
      })
    )

  }


  public showActionSheet(photo: UserPhoto, position: number) {
    this.clickImageMenu$().pipe(
      switchMap((values) => {
        if (values != null && values.data != null && values.data.action === this.typeAction.delete) {
          return this.photoService.deletePicture(photo, position)
        } else {
          return EMPTY
        }
      })
    )
      .subscribe(values => {
        console.log('complete')
        console.log(values)
      })
  }

}
