const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const axios = require('axios');
const qs = require('qs');
const admin = require('firebase-admin');

router.post('/', async (req, res) =>{
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    }
    const db = admin.firestore();

    // Middleware to handle raw body
    router.use(express.raw({ type: '*/*' }));

    router.post('/notify', async (req, res) => {
        const rawBody = req.body.toString(); // Raw string PayFast sent
        const pfData = qs.parse(rawBody);    // Parse into key-values

        console.log("📥 Received IPN:", pfData);

        try {
            // Validate with PayFast
            const verifyResponse = await axios.post(
                'https://www.payfast.co.za/eng/query/validate',
                rawBody,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            if (verifyResponse.data !== 'VALID') {
                console.error("❌ IPN is not valid");
                return res.status(400).send("Invalid IPN");
            }

            // If valid and complete
            if (pfData.payment_status === 'COMPLETE') {
                const uid = pfData.custom_str1 || null;
                const email = pfData.email_address || 'unknown';

                // Save transaction to Firestore
                await db.collection('transactions').add({
                    uid,
                    email,
                    payment_status: pfData.payment_status,
                    amount_gross: pfData.amount_gross,
                    fullData: pfData,
                    createdAt: admin.firestore.Timestamp.now()
                });

                console.log("✅ Transaction recorded");

                // Update user plan
                if (uid) {
                    const userRef = db.collection('users').doc(uid);
                    await userRef.set({
                        plan: 'pro',
                        upgradedAt: admin.firestore.Timestamp.now()
                    }, { merge: true });

                    console.log("👑 User upgraded to pro");
                }
            }

            return res.status(200).send("IPN processed");

        } catch (err) {
            console.error("💥 Error processing IPN:", err.message);
            return res.status(500).send("Server error");
        }
    })
});
 module.exports = router;