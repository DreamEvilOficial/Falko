
/**
 * Utility for persistent storage of GIF assets using IndexedDB
 * This ensures GIFs are available even if the browser cache is cleared
 * or network is unavailable.
 */

const DB_NAME = 'UrbanGifCache';
const STORE_NAME = 'gifs';
const DB_VERSION = 1;

export class GifPersistence {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('GifPersistence: Error opening DB', event);
        reject('Error opening DB');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  public async saveGif(url: string, blob: Blob): Promise<void> {
    await this.initPromise;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Store with metadata
        const item = {
          blob,
          timestamp: Date.now(),
          url
        };
        
        const request = store.put(item, url);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  public async getGif(url: string): Promise<Blob | null> {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.blob) {
            resolve(result.blob);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => resolve(null); // Fail gracefully
      } catch (e) {
        resolve(null);
      }
    });
  }
  
  public async prefetchGif(url: string): Promise<void> {
    // Check if we have it first
    const existing = await this.getGif(url);
    if (existing) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      await this.saveGif(url, blob);
    } catch (error) {
      console.warn(`GifPersistence: Failed to prefetch ${url}`, error);
    }
  }
}

export const gifPersistence = new GifPersistence();
