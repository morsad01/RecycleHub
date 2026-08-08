// test-brevo.js
// Brevo SMTP Test Script

const nodemailer = require('nodemailer');

const CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'b4d5b8001@smtp-brevo.com',
    pass: 'xsmtpsib-3bb7da730e7162161563e8aa850a02aba639647bce031d8effb53bcadab5a0e3-JvjVZwxihk8t79Xj',
  },
  senderEmail: 'morsadulislam0011@gmail.com', // আপনার ভেরিফাইড সেন্ডার ইমেইল
  recipientEmail: 'morsadulislam0011@gmail.com',
};

async function testBrevo() {
  console.log('🚀 1. Brevo SMTP Transporter তৈরি করা হচ্ছে...');
  console.log(`   Host: ${CONFIG.host}:${CONFIG.port}`);
  console.log(`   User: ${CONFIG.auth.user}`);

  const transporter = nodemailer.createTransport({
    host: CONFIG.host,
    port: CONFIG.port,
    secure: CONFIG.secure,
    auth: {
      user: CONFIG.auth.user,
      pass: CONFIG.auth.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('\n🔍 2. Brevo সার্ভারে কানেকশন এবং লগইন ভেরিফাই করা হচ্ছে...');
    await transporter.verify();
    console.log('✅ Brevo SMTP সার্ভারের সাথে কানেকশন ও লগইন সফল হয়েছে!');

    console.log('\n📧 3. টেস্ট ইমেইল পাঠানোর চেষ্টা করা হচ্ছে...');
    console.log(`   From: ${CONFIG.senderEmail}`);
    console.log(`   To: ${CONFIG.recipientEmail}`);

    const info = await transporter.sendMail({
      from: `"ResellBD Test" <${CONFIG.senderEmail}>`,
      to: CONFIG.recipientEmail,
      subject: '✅ Brevo SMTP Test Email - ResellBD',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #16a34a;">অভিনন্দন! 🎉</h2>
          <p>আপনার <strong>Brevo SMTP</strong> সেটআপ ১০০% কাজ করছে।</p>
          <p>এই ক্রেডেনশিয়ালটি এখন নির্ভয়ে Supabase ড্যাশবোর্ডে ব্যবহার করতে পারেন।</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <small style="color: #6b7280;">Sent via ResellBD Brevo Tester</small>
        </div>
      `,
    });

    console.log('\n🎉 ইমেইল সফলভাবে চলে গেছে!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n👉 আপনার ইনবক্স চেক করে দেখুন মেইল এসেছে কি না।');

  } catch (error) {
    console.error('\n❌ Brevo SMTP টেস্ট ব্যর্থ হয়েছে!');
    console.error('   Error Code:', error.code || 'N/A');
    console.error('   Error Message:', error.message);

    console.log('\n🛠️ বিস্তারিত সমাধান:');
    if (error.responseCode === 535 || error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
      console.log('   👉 ১. User বা SMTP Key ভুল হয়েছে।');
    } else if (error.message.includes('unverified') || error.message.includes('sender')) {
      console.log('   👉 ২. Sender Email ভেরিফাই করা নেই! Brevo > Senders & IP তে গিয়ে আপনার senderEmail টি ভেরিফাই করুন।');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   👉 ৩. পোর্ট ৫৮৭ ব্লকড হতে পারে। পোর্ট ৪৬৫ বা ২৫২৫ ট্রাই করুন।');
    } else {
      console.log('   👉 ৪. রেসপন্স বিস্তারিত দেখুন: ' + JSON.stringify(error));
    }
  }
}

testBrevo();
