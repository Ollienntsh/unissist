/*
 * Largely adapted from Jake Archibald's idb-keyval
 * from https://github.com/jakearchibald/idb-keyval
 */
export default function indexdbAdapter(storeKey, version) {
  let db;
  storeKey = storeKey || 'unistorePersist';
  version = version || 1;

  function getDB() {
    if (!db) {
      db = new Promise(function(resolve, reject) {
        const openreq = indexedDB.open(storeKey, version);

        openreq.onerror = function() {
          reject(openreq.error);
        };

        openreq.onupgradeneeded = function() {
          // First time setup: create an empty object store
          openreq.result.createObjectStore(storeKey);
        };

        openreq.onsuccess = function() {
          resolve(openreq.result);
        };
      });
    }
    return db;
  }

  function withStore(type, callback) {
    return getDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var transaction = db.transaction(storeKey, type);
        transaction.oncomplete = function() {
          resolve();
        };
        transaction.onerror = function() {
          reject(transaction.error);
        };
        callback(transaction.objectStore(storeKey));
      });
    });
  }

  return {
    getState() {
      let req;
      return withStore('readonly', function(store) {
        req = store.get(storeKey);
      })
        .then(function() {
          return req.result;
        })
        .catch();
    },
    setState(value) {
      return withStore('readwrite', function(store) {
        store.put(value, storeKey);
      }).catch();
    },
    clearState() {
      return withStore('readwrite', function(store) {
        store.clear();
      }).catch();
    },
  };
}
