import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { PhotoService, UserPhoto } from '../services/photo.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(private photoService: PhotoService) { }
  get photos$(): Observable<UserPhoto[]> {
    return this.photoService.photos$
  }
  addPhotoToGallery(): void {
    console.log('click')
    this.photoService.getPhotoToGalleryOrCamera().subscribe(
      photo => {
        this.photoService.addPhotoToGallery(photo);
      },
      error => {
        console.log('error');
        console.log(error);
      });
  }
}
