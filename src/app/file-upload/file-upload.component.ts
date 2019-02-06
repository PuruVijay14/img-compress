import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { forkJoin, from, Observable } from 'rxjs';
import { finalize, map } from "rxjs/operators";
import { httpFactory } from '@angular/http/src/http_module';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent implements OnInit {

  // Main taskskz
  tasks: Array<AngularFireUploadTask> = [];

  // Percantage
  // percantage: Observable<number> = of(0);
  percantage = 0;

  snapshot: Observable<any>;

  // Download URL
  downloadURL: Observable<any>;

  // State for dropzone hovering: CSS toggling
  isHovering: boolean;

  constructor(
    private storage: AngularFireStorage,
    private http: HttpClient
  ) { }

  ngOnInit() {
  }

  toggleHover($event) {
    this.isHovering = !$event;
  }

  async startUpload(event: FileList) {
    // console.log(event);
    // The file object
    // const file = event.item(0);
    const files = [];
    const filePaths = [];

    for (let i = 0; i < event.length; i++) {
      files.push(event.item(i));
    }

    const files$ = from(files).pipe(
      map((file: File) => {
        // The storage path
        const path = `${new Date().getTime()}_${file.name}`;

        // Totally optional metadata
        const customMetadata = {
          name: file.name,
          size: `${file.size}`,
        };

        filePaths.push(path);

        const task = this.storage.upload(path, file, { customMetadata });

        // The main task
        this.tasks.push(task);
        return task;
      })
    );

    forkJoin(files$).pipe(
      finalize(() => {
        this.http
          .post('http://localhost:5000/img-compress/us-central1/compress', { filePaths })
          .subscribe(console.log);
      })
    ).subscribe(data => console.log(files));

  }

  // Determine if the upload task is active
  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
