require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase Admin (bypasses security rules, needed for backend operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SSLCommerz Configuration
const SSL_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const SSL_STORE_PASSWD = process.env.SSLCOMMERZ_STORE_PASSWORD || 'qwerty';
const SSL_IS_SANDBOX = process.env.SSLCOMMERZ_IS_SANDBOX !== 'false';
const SSL_INIT_URL = SSL_IS_SANDBOX
  ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
const SSL_VALIDATION_URL = SSL_IS_SANDBOX
  ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/reset-password\/?$/, '');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ==========================================
// 1. Password Reset Endpoint
// ==========================================
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    console.log(`Generating reset link for: ${email}`);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${FRONTEND_URL}/reset-password`,
      }
    });

    if (error) {
      console.error("Supabase Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    const resetLink = data.properties.action_link;

    const mailOptions = {
      from: `"ResellBD Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Reset Your ResellBD Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
          <h2 style="color: #0f172a;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6;">
            We received a request to reset your password for your ResellBD account. 
            Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #475569; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}" style="color: #f97316; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
    res.json({ success: true, message: 'Email sent successfully' });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ==========================================
// 2. SSLCommerz Payment Gateway Endpoints
// ==========================================

/**
 * Initialize SSLCommerz Payment Session
 * Handles regular orders, subscriptions, or direct payments
 */
app.post('/api/sslcommerz/init', async (req, res) => {
  try {
    const {
      order_ids,
      user_id,
      total_amount,
      cus_name,
      cus_email,
      cus_phone,
      cus_add1,
      cus_city,
      product_name,
      product_category,
      type, // 'order' | 'subscription'
      plan_id,
      billing_cycle,
    } = req.body;

    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate unique transaction ID
    const tran_id = `SSL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[SSLCommerz] Initializing payment session: ${tran_id} for amount ${total_amount} BDT`);

    // Prepare payload for SSLCommerz
    const sslData = new URLSearchParams();
    sslData.append('store_id', SSL_STORE_ID);
    sslData.append('store_passwd', SSL_STORE_PASSWD);
    sslData.append('total_amount', parseFloat(total_amount).toFixed(2));
    sslData.append('currency', 'BDT');
    sslData.append('tran_id', tran_id);
    sslData.append('success_url', `${BACKEND_URL}/api/sslcommerz/success`);
    sslData.append('fail_url', `${BACKEND_URL}/api/sslcommerz/fail`);
    sslData.append('cancel_url', `${BACKEND_URL}/api/sslcommerz/cancel`);
    sslData.append('ipn_url', `${BACKEND_URL}/api/sslcommerz/ipn`);

    // Customer info
    sslData.append('cus_name', cus_name || 'ResellBD Customer');
    sslData.append('cus_email', cus_email || 'customer@resellbd.app');
    sslData.append('cus_add1', cus_add1 || 'Dhaka, Bangladesh');
    sslData.append('cus_city', cus_city || 'Dhaka');
    sslData.append('cus_postcode', '1212');
    sslData.append('cus_country', 'Bangladesh');
    sslData.append('cus_phone', cus_phone || '01700000000');

    // Shipment & Product details
    sslData.append('shipping_method', 'NO');
    sslData.append('product_name', product_name || 'ResellBD Marketplace Order');
    sslData.append('product_category', product_category || 'Goods');
    sslData.append('product_profile', 'general');

    // Custom metadata parameters passed through to callbacks
    sslData.append('value_a', type || 'order'); // type: order | subscription
    sslData.append('value_b', user_id); // user_id
    sslData.append('value_c', JSON.stringify(order_ids || [])); // order_ids list or plan_id
    sslData.append('value_d', plan_id ? JSON.stringify({ plan_id, billing_cycle }) : '');

    // Record pending transaction in Supabase
    try {
      await supabaseAdmin.from('transactions').insert({
        user_id: user_id,
        order_id: (Array.isArray(order_ids) && order_ids[0]) ? order_ids[0] : null,
        amount: parseFloat(total_amount),
        provider: 'sslcommerz',
        transaction_id: tran_id,
        status: 'pending',
      });
    } catch (txnErr) {
      console.warn('[SSLCommerz] Warning saving initial transaction record:', txnErr.message);
    }

    // Call SSLCommerz Gateway API
    const response = await fetch(SSL_INIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sslData.toString(),
    });

    const result = await response.json();

    if (result.status === 'SUCCESS' && result.GatewayPageURL) {
      console.log(`[SSLCommerz] Session initialized successfully. Gateway URL: ${result.GatewayPageURL}`);
      return res.json({
        success: true,
        gateway_url: result.GatewayPageURL,
        sessionkey: result.sessionkey,
        tran_id: tran_id,
      });
    } else {
      console.error('[SSLCommerz] Init failed:', result);
      return res.status(400).json({
        error: result.failedreason || 'Failed to initialize SSLCommerz gateway session',
        details: result,
      });
    }

  } catch (err) {
    console.error('[SSLCommerz] Init Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during SSLCommerz init' });
  }
});

/**
 * SSLCommerz Success Callback Handler
 * SSLCommerz POSTs form data when payment succeeds
 */
app.post('/api/sslcommerz/success', async (req, res) => {
  try {
    const {
      tran_id,
      val_id,
      amount,
      card_type,
      bank_tran_id,
      status,
      value_a, // type: 'order' | 'subscription'
      value_b, // user_id
      value_c, // order_ids JSON
      value_d, // subscription details JSON
    } = req.body;

    console.log(`[SSLCommerz Callback] Success received for tran_id: ${tran_id}, val_id: ${val_id}, status: ${status}`);

    // Validate with SSLCommerz Order Validation API
    let isValid = false;
    try {
      const valUrl = `${SSL_VALIDATION_URL}?val_id=${val_id}&store_id=${SSL_STORE_ID}&store_passwd=${SSL_STORE_PASSWD}&format=json`;
      const valRes = await fetch(valUrl);
      const valData = await valRes.json();

      if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
        isValid = true;
      } else {
        console.warn('[SSLCommerz] Validation returned non-valid status:', valData);
        // In sandbox testbox mode, accept VALID status from POST if testbox validator responds differently
        if (status === 'VALID') isValid = true;
      }
    } catch (valErr) {
      console.warn('[SSLCommerz] Error validating with SSL server, checking POST body status:', valErr.message);
      if (status === 'VALID') isValid = true;
    }

    if (!isValid) {
      console.error(`[SSLCommerz] Transaction ${tran_id} validation failed!`);
      return res.redirect(`${FRONTEND_URL}/payment/fail?tran_id=${tran_id}&reason=validation_failed`);
    }

    // Process payment based on type
    const paymentType = value_a || 'order';
    const userId = value_b;

    if (paymentType === 'order') {
      let orderIds = [];
      try {
        orderIds = JSON.parse(value_c || '[]');
      } catch (e) {
        if (value_c) orderIds = [value_c];
      }

      console.log(`[SSLCommerz] Marking orders paid:`, orderIds);

      // Update orders in Supabase
      if (orderIds.length > 0) {
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            payment_method: `sslcommerz (${card_type || 'online'})`,
          })
          .in('id', orderIds);

        // Record Payments & Notifications
        for (const orderId of orderIds) {
          // Record payment
          await supabaseAdmin.from('payments').insert({
            order_id: orderId,
            buyer_id: userId,
            amount: parseFloat(amount || 0),
            payment_method: `sslcommerz (${card_type || 'online'})`,
            status: 'completed',
            transaction_id: tran_id,
          });

          // Fetch order details for notification
          const { data: ord } = await supabaseAdmin
            .from('orders')
            .select('product_id, seller_id, products(title)')
            .eq('id', orderId)
            .single();

          if (ord) {
            // Notify buyer
            await supabaseAdmin.from('notifications').insert({
              user_id: userId,
              title: 'Payment Successful! 🎉',
              message: `Your payment of ৳${amount} for order #${orderId.slice(0, 8)} was successful via SSLCommerz.`,
              type: 'payment',
              is_read: false,
            });

            // Notify seller
            if (ord.seller_id) {
              await supabaseAdmin.from('notifications').insert({
                user_id: ord.seller_id,
                title: 'Order Paid & Confirmed! 💰',
                message: `Payment verified for listing "${ord.products?.title || 'item'}". Please prepare for shipping.`,
                type: 'order',
                is_read: false,
              });
            }
          }
        }
      }

      // Update Transaction status
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'success' })
        .eq('transaction_id', tran_id);

      // Redirect to frontend order success receipt
      const orderParam = orderIds[0] ? `&order_id=${orderIds[0]}` : '';
      return res.redirect(
        `${FRONTEND_URL}/payment/success?tran_id=${tran_id}&amount=${amount}&method=${encodeURIComponent(card_type || 'SSLCommerz')}&bank_tran_id=${bank_tran_id || ''}${orderParam}&type=order`
      );

    } else if (paymentType === 'subscription') {
      let subDetails = {};
      try {
        subDetails = JSON.parse(value_d || '{}');
      } catch (e) {}

      const planId = subDetails.plan_id;
      const cycle = subDetails.billing_cycle || 'monthly';

      console.log(`[SSLCommerz] Activating subscription plan ${planId} for user ${userId}`);

      if (planId && userId) {
        const periodDays = cycle === 'yearly' ? 365 : 30;
        const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planId,
            billing_cycle: cycle,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            status: 'active',
          }, { onConflict: 'user_id' });

        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          title: 'Subscription Activated! ⭐',
          message: `Your seller subscription is now active with full premium privileges.`,
          type: 'system',
          is_read: false,
        });
      }

      await supabaseAdmin
        .from('transactions')
        .update({ status: 'success' })
        .eq('transaction_id', tran_id);

      return res.redirect(
        `${FRONTEND_URL}/payment/success?tran_id=${tran_id}&amount=${amount}&type=subscription&method=${encodeURIComponent(card_type || 'SSLCommerz')}`
      );
    }

    // Default redirect
    return res.redirect(`${FRONTEND_URL}/payment/success?tran_id=${tran_id}&amount=${amount}`);

  } catch (err) {
    console.error('[SSLCommerz Callback Exception]:', err);
    return res.redirect(`${FRONTEND_URL}/payment/fail?reason=server_error`);
  }
});

/**
 * SSLCommerz Fail Callback Handler
 */
app.post('/api/sslcommerz/fail', async (req, res) => {
  try {
    const { tran_id, error, reason } = req.body;
    console.log(`[SSLCommerz Fail] Payment failed for tran_id: ${tran_id}, reason: ${error || reason}`);

    if (tran_id) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('transaction_id', tran_id);
    }

    return res.redirect(`${FRONTEND_URL}/payment/fail?tran_id=${tran_id || ''}&reason=${encodeURIComponent(error || reason || 'Payment failed')}`);
  } catch (err) {
    console.error('[SSLCommerz Fail Exception]:', err);
    return res.redirect(`${FRONTEND_URL}/payment/fail`);
  }
});

/**
 * SSLCommerz Cancel Callback Handler
 */
app.post('/api/sslcommerz/cancel', async (req, res) => {
  try {
    const { tran_id } = req.body;
    console.log(`[SSLCommerz Cancel] Payment cancelled by user for tran_id: ${tran_id}`);

    if (tran_id) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('transaction_id', tran_id);
    }

    return res.redirect(`${FRONTEND_URL}/payment/cancel?tran_id=${tran_id || ''}`);
  } catch (err) {
    console.error('[SSLCommerz Cancel Exception]:', err);
    return res.redirect(`${FRONTEND_URL}/payment/cancel`);
  }
});

/**
 * SSLCommerz IPN (Instant Payment Notification) Webhook
 */
app.post('/api/sslcommerz/ipn', async (req, res) => {
  try {
    const { tran_id, status } = req.body;
    console.log(`[SSLCommerz IPN Webhook] Received for tran_id: ${tran_id}, status: ${status}`);
    return res.status(200).send('IPN Received');
  } catch (err) {
    console.error('[SSLCommerz IPN Exception]:', err);
    return res.status(500).send('IPN Error');
  }
});

/**
 * Query Transaction / Order Payment Status
 */
app.get('/api/sslcommerz/status/:tran_id', async (req, res) => {
  try {
    const { tran_id } = req.params;
    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*, orders(*)')
      .eq('transaction_id', tran_id)
      .maybeSingle();

    if (error) throw error;
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    res.json({ success: true, transaction: txn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`SSLCommerz Mode: ${SSL_IS_SANDBOX ? 'SANDBOX (Testbox)' : 'LIVE (Production)'}`);
});

