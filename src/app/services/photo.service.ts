import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {from, Observable, ReplaySubject, Subject} from 'rxjs';
import {startWith} from "rxjs/operators";

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private storedPhoto: UserPhoto[] = [];
  private emitPhotos: ReplaySubject<UserPhoto[]> = new ReplaySubject();

  public get photos$(): Observable<UserPhoto[]> {
    return this.emitPhotos.asObservable();
  }

  constructor() {
  }

  public getPhotoToGalleryOrCamera(): Observable<Photo> {
    // Take a photo
    const capturedPhoto = Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    return from(capturedPhoto);
  }

  public addPhotoToGallery(capturedPhoto: Photo | null) {
    if (capturedPhoto != null) {
      this.storedPhoto.unshift({
        filepath: "soon...",
        webviewPath: capturedPhoto.webPath
      });
    }
    this.emitPhotos.next(this.storedPhoto.slice());
  }
}
