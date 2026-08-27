import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { expressConnectMiddleware } from "@connectrpc/connect-express";
import { ConnectRouter } from "@connectrpc/connect";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

/**
 * Connect-RPC Routes & Service Implementations
 */
function routes(router: ConnectRouter) {
  router.service({
    typeName: "pokedex.v1.PokedexService",
    methods: {
      listCards: {
        name: "ListCards",
        I: Object,
        O: Object,
        kind: 0,
      },
      getCard: {
        name: "GetCard",
        I: Object,
        O: Object,
        kind: 0,
      },
      listDecks: {
        name: "ListDecks",
        I: Object,
        O: Object,
        kind: 0,
      },
      syncCollection: {
        name: "SyncCollection",
        I: Object,
        O: Object,
        kind: 0,
      }
    }
  } as any, {
    async listCards(req: any) {
      const snapshot = await db.collection("cards").limit(req.pageSize || 50).get();
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return {
        cards,
        totalCount: cards.length,
        page: req.page || 1,
        totalPages: 1
      };
    },
    async getCard(req: any) {
      if (!req.cardId) throw new Error("cardId is required");
      const doc = await db.collection("cards").doc(req.cardId).get();
      if (!doc.exists) throw new Error("Card not found");
      return { id: doc.id, ...doc.data() };
    },
    async listDecks() {
      const snapshot = await db.collection("decks").get();
      const decks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { decks };
    },
    async syncCollection(req: any) {
      if (!req.userId) throw new Error("userId is required");
      const batch = db.batch();
      const userRef = db.collection("users").doc(req.userId);
      batch.set(userRef, { lastSyncedAt: Date.now(), cardQuantities: req.cardQuantities }, { merge: true });
      await batch.commit();
      return {
        success: true,
        totalSyncedCards: Object.keys(req.cardQuantities || {}).length,
        timestamp: BigInt(Date.now())
      };
    }
  });
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(expressConnectMiddleware({ routes }));

// Export Cloud Functions 2nd Gen HTTPS endpoint
export const api = onRequest({ region: "southamerica-east1", cors: true }, app);
