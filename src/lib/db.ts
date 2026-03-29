import { openDB, type IDBPDatabase } from 'idb';

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface PhotoMarker {
  id?: number;
  lat: number;
  lng: number;
  photoBlob: Blob;
  shopName?: string;
  timestamp: number;
}

const DB_NAME = 'tabinikki-db';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'timestamp' });
      }
      if (!db.objectStoreNames.contains('markers')) {
        db.createObjectStore('markers', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function addLocation(point: LocationPoint) {
  const db = await initDB();
  return db.add('locations', point);
}

export async function getLocations(): Promise<LocationPoint[]> {
  const db = await initDB();
  return db.getAll('locations');
}

export async function addMarker(marker: PhotoMarker) {
  const db = await initDB();
  return db.add('markers', marker);
}

export async function getMarkers(): Promise<PhotoMarker[]> {
  const db = await initDB();
  return db.getAll('markers');
}

export async function clearAllData() {
  const db = await initDB();
  await db.clear('locations');
  await db.clear('markers');
}
