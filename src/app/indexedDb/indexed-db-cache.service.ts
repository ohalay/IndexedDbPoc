import { Cache } from '../сache/cache';
import { IEntity } from '../сache/ientity';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class IndexedDbCache implements Cache {

  private tableName = 'httpResponces';

  getDb(): Observable<IDBDatabase> {
    const dbName = 'cache';
    return Observable.create(observer => {
      const req = window.indexedDB.open(dbName, 1);
      req.onsuccess = (e) => {
          const db = (<any>event.target).result;
          observer.next(db);
          db.close();
          observer.complete();
      };
      req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (<any>e.target).result;
            db.createObjectStore(this.tableName, { keyPath: 'id' });
            const transaction = (<any>e.target).transaction;
            transaction.oncomplete = (event) => {
                observer.next(db);
                db.close();
                observer.complete();
            };
      };
      req.onblocked = event => observer.error('IndexedDB is blocked');
      req.onerror = (e: ErrorEvent) => observer.error(e.error);
    });
  }

  add<T>(key: string, data: T) {
    this.getDb().subscribe(db => {
      db.transaction(this.tableName)
      .objectStore(this.tableName)
      .add(data, key);
    });
  }

  remove(key: string) {
    this.getDb().subscribe(db => {
      db.transaction(this.tableName)
      .objectStore(this.tableName)
      .delete(key);
    });
  }

  get<T>(key: string): Observable<T> {
    return Observable.create(observer => {
      this.getDb().subscribe(db => {
        const req = db.transaction(this.tableName)
        .objectStore(this.tableName)
        .get(key);

        req.onsuccess = e => {
          observer.next(req.result);
          observer.complete();
        };

        req.onerror = (e: ErrorEvent) => {
          observer.error(e.error);
        };
      });
    });
  }
}