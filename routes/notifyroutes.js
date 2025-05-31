const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const admin = require('firebase-admin');
const firestore = require("firebase/firestore");

// Initialize Firebase Admin once globally
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}
const db = admin.firestore();

// Middleware to handle raw body globally for this router
router.use(express.raw({ type: '*/*' }));

router.post('/', async (req, res) => {
    try {
        // Ensure the raw body exists
        if (!req.body) {
            console.error("❌ Missing request body");
            return res.status(400).send("No payload received");
        }

        const rawBody = req.body.toString(); // Raw string sent by PayFast
        const pfData = qs.parse(rawBody); // Parse key-value pairs

        console.log("📥 Received IPN data:", pfData);

        // Validate the request with PayFast
        const verifyResponse = await axios.post(
            'https://sandbox.payfast.co.za/eng/query/validate',
            rawBody,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        if (verifyResponse.data !== 'VALID') {
            console.error("❌ Invalid IPN");
            return res.status(400).send("Invalid IPN");
        }

        // Process the transaction if the payment is complete
        if (pfData.payment_status === 'COMPLETE') {
            const uid = pfData.custom_str1 || null;
            const email = pfData.email_address || 'unknown';

            // Save transaction to Firestore
            await db.collection('transactions').add({
                uid: pfData.custom_str1,
                email: pfData.custom_str2,
                payment_status: pfData.payment_status,
                amount_gross: pfData.amount_gross,
                fullData: pfData,
                createdAt: admin.firestore.Timestamp.now(),
            });

            console.log("✅ Transaction saved");

            // Update the user's plan in Firestore
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days in ms
            const expiresAtTimestamp = firestore.Timestamp.fromDate(expiresAt);

            if (uid) {
                const userRef = db.collection('users').doc(uid);
                await userRef.set(
                    {
                        plan: 'pro',
                        upgradedAt: admin.firestore.Timestamp.now(),
                        pro_expires_at: expiresAtTimestamp
                    },
                    { merge: true }
                );
                console.log("👑 User upgraded to Pro");
            }
        }

        return res.status(200).send("IPN processed successfully");
    } catch (err) {
        console.error("💥 Error processing IPN:", err.message);
        return res.status(500).send("Server error");
    }
});

module.exports = router;