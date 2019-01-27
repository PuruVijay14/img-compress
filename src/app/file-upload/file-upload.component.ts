import { Component, OnInit } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { } from 'rxjs/Observable';
import { Observable } from 'rxjs';
import { finalize } from "rxjs/operators";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {

  // Main task
  task: AngularFireUploadTask;

  // Percantage
  percantage: Observable<number>;

  snapshot: Observable<any>;

  // Download URL
  downloadURL: Observable<any>;

  // State for dropzone hovering: CSS toggling
  isHovering: boolean;

  constructor(private storage: AngularFireStorage) { }

  ngOnInit() {
  }

  toggleHover($event) {
    this.isHovering = !$event;
  }

  startUpload(event: FileList) {
    // The file object
    const file = event.item(0);

    // Client-side validation example
    if (file.type.split('/')[0] !== 'image') {
      console.error('Unsupported file type ☹');
    }

    // The storage path
    const path = `${new Date().getTime()}_${file.name}`;

    // Totally optional metadata
    const customMetadata = {
      app: 'img-compress'
    };

    // The main task
    this.task = this.storage.upload(path, file, { customMetadata });

    // Progress monitoring
    this.percantage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges();

    this.task.then(() => {
      this.downloadURL = this.storage.ref(path).getDownloadURL();
    });

  }

  // Determine if the upload task is active
  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
