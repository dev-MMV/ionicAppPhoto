import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {PhotoService, UserPhoto} from '../services/photo.service';
import {startWith, switchMap, tap} from "rxjs/operators";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  // public photos: UserPhoto[] = [];

  constructor(private photoService: PhotoService) {
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
}
