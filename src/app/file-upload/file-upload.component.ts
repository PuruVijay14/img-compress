import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { forkJoin, from, Observable, of, combineLatest } from 'rxjs';
import { concatAll, map, reduce, combineAll } from "rxjs/operators";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent implements OnInit {

  // Main tasks
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
    private storage: AngularFireStorage
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
          size: `${file.size}`
        };

        const task = this.storage.upload(path, file, { customMetadata });

        // The main task
        this.tasks.push(task);
        return task;
      })
    );

    // const This = this;
    // console.log(files$);
    forkJoin(files$).pipe(
      map(([item]) => {
        // This.tasks.push(item);
        return item.percentageChanges();
      }),
      combineAll()
    ).subscribe(console.log);



    // Client-side validation example
    // if (file.type.split('/')[0] !== 'image') {
    //   console.error('Unsupported file type ☹');
    // }

    /* for (const file of files) {
      // The storage path
      const path = `${new Date().getTime()}_${file.name}`;

      // Totally optional metadata
      const customMetadata = {
        app: 'img-compress'
      };

      // The main task
      this.task = this.storage.upload(path, file, { customMetadata });

      // Progress monitoring
      this.percantage = combineLatest(this.percantage, this.task.percentageChanges())
        .pipe(
          map(([p1], p2) => (p1 + p2) / files.length)
        );
      this.snapshot = this.task.snapshotChanges();
      this.percantage.subscribe(console.log);

      this.task.then(() => {
        this.downloadURL = this.storage.ref(path).getDownloadURL();
      });
  } */

  }

  // Determine if the upload task is active
  isActive(snapshot) {
    return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes;
  }

}
