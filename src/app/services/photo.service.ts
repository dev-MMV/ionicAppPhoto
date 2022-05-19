import {Injectable} from '@angular/core';
import {Camera, CameraResultType, CameraSource, Photo} from '@capacitor/camera';
import {EMPTY, forkJoin, from, Observable, ReplaySubject, Subject} from 'rxjs';
import {map, startWith, switchMap} from "rxjs/operators";
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Storage} from "@capacitor/storage";
import {Platform} from "@ionic/angular";
import {Capacitor} from "@capacitor/core";
import {fromPromise} from "rxjs/internal-compatibility";

export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}

export function arrayIsSet<T>(array: any | T[]): array is T[] {
  return Array.isArray(array) && array.length > 0;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private storedPhoto: UserPhoto[] = [];
  private emitPhotos: ReplaySubject<UserPhoto[]> = new ReplaySubject();
  private PHOTO_STORAGE: string = 'photos';

  public get photos$(): Observable<UserPhoto[]> {
    return this.emitPhotos.asObservable();
  }

  constructor(private platform: Platform) {
  }

  private get isHybrid() {
    return this.platform.is('hybrid');
  }

  addToLocalStorage(key: string, value: any): void {
    Storage.set({
      key,
      value: JSON.stringify(value),
    });
  }

  loadSaved() {
    const photoList = Storage.get({key: this.PHOTO_STORAGE});
    photoList.then(photos => {
      const photos$: Observable<UserPhoto | never>[] = [];
      const storedsPhoto: UserPhoto[] = JSON.parse(photos.value);
      if (this.isHybrid) {
        this.storedPhoto = storedsPhoto;
        this.emitPhotos.next(this.storedPhoto.slice());
      } else {
        if (arrayIsSet(storedsPhoto)) {
          // Display the photo by reading into base64 format
          storedsPhoto.forEach(photo => {
            const readingFile = Filesystem.readFile({
              path: photo.filepath,
              directory: Directory.Data,
            });

            // Web platform only: Load the photo as base64 data
            photos$.push(from(readingFile).pipe(
              map(readFile => {
                photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
                return photo;
              })
            ));
          });
        } else {
          photos$.push(EMPTY);
        }
        forkJoin(photos$).subscribe((storedsPhotoUpdated: UserPhoto[]) => {
          this.storedPhoto = storedsPhotoUpdated;
          this.emitPhotos.next(this.storedPhoto.slice());
        });
      }
    });
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

  public addPhotoToGallery(capturedPhoto: Photo | null, userPhoto: UserPhoto) {
    if (capturedPhoto != null) {
      this.storedPhoto.unshift({
        filepath: "soon...",
        webviewPath: capturedPhoto.webPath
      });
    }
    this.emitPhotos.next(this.storedPhoto.slice());
  }

  public addUserPhotoToGallery(userPhoto: UserPhoto) {
    if (userPhoto != null) {
      this.storedPhoto.unshift({
        filepath: userPhoto.filepath,
        webviewPath: userPhoto.webviewPath
      });
    }
    this.addToLocalStorage(this.PHOTO_STORAGE, this.storedPhoto);
    this.emitPhotos.next(this.storedPhoto.slice());
  }


  private convertBlobToBase64(blob: Blob): Observable<string | ArrayBuffer> {
    return new Observable((subscriber) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onerror = (error) => {
        subscriber.error(error);
        subscriber.complete();
        subscriber.unsubscribe();
      };
      reader.onload = () => {
        subscriber.next(reader.result);
        subscriber.complete();
        subscriber.unsubscribe();
      };
    });
  }

  private convertArrayBufferToString(arrayBuffer: ArrayBuffer): string {
    return new TextDecoder('utf-8').decode(arrayBuffer);
  }

  private readAsBase64(photo: Photo): Observable<string> {
    // Fetch the photo, read as a blob, then convert to base64 format
    let obj$;
    if (this.isHybrid) {
      const file = Filesystem.readFile({
        path: photo.path
      });
      return from(file).pipe(
        map((readedFile) => readedFile.data)
      );
    } else {
      const blob = fetch(photo.webPath).then(response => response.blob());
      obj$ = from(blob).pipe(
        switchMap((blobFile) => this.convertBlobToBase64(blobFile)),
        map((val) => {
          if (typeof val == 'string') {
            return val;
          } else {
            return this.convertArrayBufferToString(val);
          }
        })
      );
    }

    return obj$;
  }

  public savePicture(photo: Photo): Observable<UserPhoto> {
    // Convert photo to base64 format, required by Filesystem API to save
    // Write the file to the data directory
    const savedFile = (name: string, base64: string,) => Filesystem.writeFile({
      path: name,
      data: base64,
      directory: Directory.Data
    });

    const fileName = new Date().getTime() + '.jpeg';
    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return this.readAsBase64(photo).pipe(
      switchMap((base64) => from(savedFile(fileName, base64))),
      map(photoStored => {
        let userPhoto: UserPhoto;
        if (this.isHybrid) {
          userPhoto = {
            filepath: photoStored.uri,
            webviewPath: Capacitor.convertFileSrc(photoStored.uri),
          };
        } else {
          userPhoto = {
            filepath: fileName,
            webviewPath: photo.webPath
          };
        }
        return userPhoto;
      })
    );
  }

  deletePicture(photo: UserPhoto, position: number) {
    this.storedPhoto.splice(position, 1);
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.storedPhoto)
    });

    return fromPromise(Filesystem.deleteFile({
      path: photo.filepath,
      directory: Directory.Data
    })).pipe(
      map(() => {
        this.emitPhotos.next(this.storedPhoto.slice())
        return photo
      })
    )
  }

}
