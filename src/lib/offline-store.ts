const DB_NAME = 'minded-offline';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initOfflineStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Store for AI suggestions
      if (!database.objectStoreNames.contains('suggestions')) {
        database.createObjectStore('suggestions', { keyPath: 'id' });
      }
      
      // Store for habits (for offline tracking)
      if (!database.objectStoreNames.contains('habits')) {
        database.createObjectStore('habits', { keyPath: 'id' });
      }
      
      // Store for pending actions (to sync when back online)
      if (!database.objectStoreNames.contains('pendingActions')) {
        const pendingStore = database.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('createdAt', 'createdAt');
      }
    };
  });
}

export async function cacheSuggestions(suggestions: any[]): Promise<void> {
  if (!db) await initOfflineStore();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['suggestions'], 'readwrite');
    const store = transaction.objectStore('suggestions');
    
    // Clear old cache
    store.clear();
    
    // Add new suggestions with timestamp
    suggestions.forEach((s, i) => {
      store.add({ 
        id: `suggestion-${i}`, 
        data: s, 
        cachedAt: Date.now() 
      });
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedSuggestions(): Promise<any[]> {
  if (!db) await initOfflineStore();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['suggestions'], 'readonly');
    const store = transaction.objectStore('suggestions');
    const request = store.getAll();
    
    request.onsuccess = () => {
      // Filter out expired cache (24 hours)
      const cached = request.result
        .filter(s => Date.now() - s.cachedAt < 24 * 60 * 60 * 1000)
        .map(s => s.data);
      resolve(cached);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function cacheHabits(habits: any[]): Promise<void> {
  if (!db) await initOfflineStore();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['habits'], 'readwrite');
    const store = transaction.objectStore('habits');
    
    store.clear();
    
    habits.forEach((h) => {
      store.add({ 
        id: h.id, 
        data: h, 
        cachedAt: Date.now() 
      });
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedHabits(): Promise<any[]> {
  if (!db) await initOfflineStore();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['habits'], 'readonly');
    const store = transaction.objectStore('habits');
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result.map(h => h.data));
    };
    
    request.onerror = () => reject(request.error);
  });
}

interface PendingAction {
  type: 'habit_log' | 'task_complete' | 'journal_entry';
  payload: any;
  createdAt: number;
}

export async function addPendingAction(action: Omit<PendingAction, 'createdAt'>): Promise<void> {
  if (!db) await initOfflineStore();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    store.add({ 
      ...action, 
      createdAt: Date.now() 
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  if (!db) await initOfflineStore();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingActions(): Promise<void> {
  if (!db) await initOfflineStore();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    store.clear();
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Initialize on import
if (typeof indexedDB !== 'undefined') {
  initOfflineStore().catch(console.error);
}
