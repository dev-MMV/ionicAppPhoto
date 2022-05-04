import { Component } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  constructor(private photoService: PhotoService) { }
   addPhotoToGallery(): void {
    console.log('click')
    this.photoService.addNewToGallery()
  }
}
