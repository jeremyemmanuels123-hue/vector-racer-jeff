import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/12.7.0';
const TOP = 10;
const WAIT_MS = 8000;
export const configured = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.appId);
export const nicknamePattern = /^[A-Za-z0-9][A-Za-z0-9 _.\-]{1,19}$/;
let connection;
let signingIn;

function deadline(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firebase belum merespons.')), WAIT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function connect() {
  if (!configured) return Promise.reject(new Error('Firebase belum dikonfigurasi.'));
  if (!connection) {
    connection = Promise.all([
      import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore-lite.js`),
    ]).then(([appSdk, authSdk, dbSdk]) => {
      const app = appSdk.getApps().find(item => item.name === 'vector-racer')
        || appSdk.initializeApp(firebaseConfig, 'vector-racer');
      return { authSdk, dbSdk, auth: authSdk.getAuth(app), db: dbSdk.getFirestore(app) };
    }).catch(error => {
      connection = undefined;
      throw error;
    });
  }
  return deadline(connection);
}

async function anonymousUser({ auth, authSdk }) {
  await deadline(auth.authStateReady());
  if (auth.currentUser?.isAnonymous) return auth.currentUser;
  signingIn ||= authSdk.signInAnonymously(auth).finally(() => { signingIn = undefined; });
  return (await deadline(signingIn)).user;
}

function scores(db, sdk, level) {
  return sdk.collection(db, 'tracks', level, 'scores');
}

export async function readScores(level) {
  const { db, dbSdk: sdk } = await connect();
  const topScores = sdk.query(scores(db, sdk, level), sdk.orderBy('steps', 'asc'), sdk.limit(TOP));
  const result = await deadline(sdk.getDocs(topScores));
  return result.docs.map(doc => doc.data());
}

export async function saveScore({ id, level, steps, nickname }) {
  const client = await connect();
  await anonymousUser(client);
  const { db, dbSdk: sdk } = client;
  const ref = sdk.doc(scores(db, sdk, level), id);
  try {
    await deadline(sdk.setDoc(ref, { level, steps, nickname, createdAt: sdk.serverTimestamp() }));
  } catch (writeError) {
    // A repeated submission keeps its original ID if the previous response was lost.
    const saved = await deadline(sdk.getDoc(ref)).then(doc => doc.data()).catch(() => null);
    if (saved?.nickname !== nickname || saved.steps !== steps || saved.level !== level) {
      throw writeError;
    }
  }
}
