# Spy Calculator - Multi-Device Messaging Guide

## Overview
This spy calculator looks like a normal calculator but has a hidden messaging system. You and your friends can send secret messages to each other using secret codes!

## 🎯 Quick Setup

### Current Users Created:
| Person | User ID | Secret Code | Email |
|--------|---------|-------------|-------|
| You | 1 | 6789 | testuser@example.com |
| Friend 1 | 3 | 1357 | friend1@example.com |
| Friend 2 | 4 | 2468 | friend2@example.com |

---

## 📱 How to Use (Step by Step)

### Step 1: Open the Calculator
Both you and your friend need to open the calculator on your devices:
- **URL:** http://localhost:3000
- For remote access, use your computer's IP address instead of localhost

### Step 2: Authenticate Yourself
Each person enters **their own** secret code:
1. Type your secret code (e.g., `6789` for you, `1357` for Friend 1)
2. Press `=` button
3. You'll see a success message with your User ID

**Example:**
- You type: `6789` → Press `=` → Message: "Authenticated as User ID: 1"
- Friend 1 types: `1357` → Press `=` → Message: "Authenticated as User ID: 3"

### Step 3: Unlock the Vault
After authentication, unlock the secret features:
1. Type `1234`
2. Press `=` button
3. The vault will unlock and you'll see your messages

### Step 4: View Messages
Once unlocked:
1. Click the **clock icon** (🕐) in the top-right corner
2. Switch to the **"Messages"** tab
3. You'll see:
   - **Send Message Form** at the top
   - **Received Messages** below

### Step 5: Send a Message
To send a message to your friend:
1. Fill in the form:
   - **Recipient User ID:** Enter your friend's User ID (e.g., `3` for Friend 1, `4` for Friend 2)
   - **Your Name:** Your name (so they know who sent it)
   - **Your Email:** Your email address
   - **Subject:** Optional message title
   - **Message:** Your secret message

2. Click **"Send Message"** button
3. Wait for success confirmation

**Example:**
```
Recipient User ID: 3
Your Name: John
Your Email: testuser@example.com
Subject: Secret Meeting
Message: Meet me at the library at 5pm
```

### Step 6: Read Messages
When someone sends you a message:
1. Enter your secret code (`6789`) and press `=`
2. Enter `1234` and press `=` to unlock
3. Click clock icon → Messages tab
4. You'll see all messages sent to your User ID
5. Click messages to mark them as read or delete them

---

## 🔐 Security Features

### Two Secret Codes:
1. **Authentication Code** (6789, 1357, 2468): Identifies who you are
2. **Vault Code** (1234): Unlocks the secret features

### How It Works:
- Each person has a unique secret code
- Messages are stored in a MySQL database
- Messages are linked to User IDs
- Only the recipient can see their messages

---

## 💬 Complete Workflow Example

**Scenario:** You (User ID: 1) want to send a message to Friend 1 (User ID: 3)

### Your Device:
1. Open calculator
2. Type `6789` → Press `=` (You're now authenticated as User 1)
3. Type `1234` → Press `=` (Vault unlocked)
4. Click clock icon → Messages tab
5. Fill in the form:
   - Recipient User ID: `3`
   - Your Name: `Your Name`
   - Your Email: `testuser@example.com`
   - Message: `Hey, are you free tonight?`
6. Click "Send Message"

### Friend 1's Device:
1. Open calculator
2. Type `1357` → Press `=` (Friend 1 authenticated as User 3)
3. Type `1234` → Press `=` (Vault unlocked)
4. Click clock icon → Messages tab
5. They see your message: "Hey, are you free tonight?"
6. They can reply by sending a message to User ID: `1`

---

## 🌐 Remote Access (Different Devices)

### If you're on the same network (WiFi):
1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Share this URL with friends:
   ```
   http://192.168.1.100:3000
   ```

3. Make sure FastAPI server is accessible:
   - Server runs on `0.0.0.0:4000` (all network interfaces)
   - Friends will connect to: `http://192.168.1.100:4000`

### Update Calculator Frontend for Remote Access:
In `client/app/page.tsx`, replace `localhost` with your IP:
```typescript
// Change this:
fetch(`http://localhost:4000/api/...`)

// To this:
fetch(`http://192.168.1.100:4000/api/...`)
```

---

## 🛠️ Technical Details

### Database Tables:
- **users:** Stores user accounts with secret codes
- **messages:** Stores all messages with sender/recipient info
- **refresh_tokens:** Manages JWT authentication

### API Endpoints:
- `POST /api/auth/secret-code` - Authenticate with secret code
- `POST /api/messages?user_id={id}` - Send message to user
- `GET /api/messages/{user_id}` - Get messages for user
- `PATCH /api/messages/{id}/read` - Mark message as read
- `DELETE /api/messages/{id}` - Delete message

### Servers Running:
- **FastAPI Backend:** http://0.0.0.0:4000
- **Next.js Frontend:** http://localhost:3000

---

## 📋 Troubleshooting

### Problem: "Please authenticate first"
**Solution:** Enter your secret code and press `=` before trying to send messages

### Problem: "Message sent successfully" but friend doesn't receive it
**Solution:** 
- Make sure you used the correct User ID
- Friend needs to refresh their messages (unlock vault again)
- Check if friend is authenticated with their secret code

### Problem: Can't connect from another device
**Solution:**
- Check firewall settings (allow ports 3000 and 4000)
- Make sure both devices are on the same network
- Use IP address instead of localhost
- Update API URLs in frontend code

### Problem: Secret code doesn't work
**Solution:**
- Make sure you're using the correct code for your account
- Codes are case-sensitive and must be exact
- Check the user list table above

---

## 🎨 Calculator Features

### Normal Calculator Mode:
- Works like a regular calculator
- Basic operations: +, −, ×, ÷
- Additional functions: %, √, x², 1/x
- History tracking

### Secret Features (After Unlocking):
- **Vault:** Store secret notes and images
- **Messages:** Send/receive encrypted messages
- **History:** View calculation history

### How to Hide:
- Click "Lock Vault" button or close the overlay
- Calculator returns to normal mode
- No one knows it's a messaging app!

---

## 📝 Tips & Best Practices

1. **Share Secret Codes Securely:** Don't write them down in public places
2. **Remember User IDs:** You need your friends' User IDs to message them
3. **Check Messages Regularly:** Enter your code and unlock vault to see new messages
4. **Delete Sensitive Messages:** Use the trash icon to delete messages after reading
5. **Use the History Feature:** Track your calculations in normal mode

---

## 🚀 Creating More Users

To add more friends, run:
```bash
cd E:\HackDay\FastAPI-Server
python setup_multiple_users.py
```

Or use the database client to manually add users to the `users` table with unique `secret_code` values.

---

## 📞 Need Help?

- Check the console for error messages (F12 in browser)
- Verify servers are running (check terminals)
- Test API endpoints using tools like Postman
- Check database for user IDs and messages

**Database Connection:**
- Host: localhost:3306
- Database: auth_db
- Username: root
- Password: Arahi2330011%

---

## ✅ Quick Reference Card

| Action | Steps |
|--------|-------|
| Authenticate | Type your secret code → Press `=` |
| Unlock Vault | Type `1234` → Press `=` |
| Open Messages | Click clock icon → Messages tab |
| Send Message | Fill form → Enter recipient User ID → Send |
| Read Messages | Unlock vault → Clock icon → Messages |
| Lock Calculator | Click "Lock Vault" or close overlay |

---

**Remember:** This calculator looks normal to anyone watching, but you and your friends know it's your secret communication tool! 🕵️‍♂️
