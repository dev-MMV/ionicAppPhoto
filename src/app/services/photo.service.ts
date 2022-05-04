import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { from, Observable, Subject } from 'rxjs';
export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}
@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private storedPhoto: UserPhoto[] = []
  private emitPhotos: Subject<UserPhoto[]> = new Subject();
  public get photos$(): Observable<UserPhoto[]> {
    return this.emitPhotos.asObservable();
  }
  constructor() {
    this.photos$.subscribe(val => {
      console.log('emit', val);
    })
  }
  public getPhotoToGalleryOrCamera(): Observable<Photo> {
    // Take a photo
    const capturedPhoto = Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    })
    return from(capturedPhoto);
  }
  public addPhotoToGallery(capturedPhoto: Photo) {
    this.storedPhoto.unshift({
      filepath: "soon...",
      webviewPath: capturedPhoto.webPath
    })
    this.emitPhotos.next([...this.storedPhoto]);
  }
}
