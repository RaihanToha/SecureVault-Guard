# 🛡️ SecureVault Guard — User Manual \& Technical Implementation Document

> \*\*A Secure Password Vault and Encrypted File Storage System with Real-Time Cryptographic Integrity Monitoring, Two-Factor Authentication (2FA), and Multi-Device Synchronization.\*\*

\---

# 📑 Master Table of Contents

* [BEGINNER'S USER MANUAL \& SETUP GUIDE](#beginners-user-manual--setup-guide)

  * [1. Introduction](#1-introduction)

    * [What is SecureVault Guard?](#what-is-securevault-guard)
    * [Core Features](#core-features)
    * [System Overview \& Visual Flowchart](#system-overview--visual-flowchart)
  * [2. Prerequisites \& System Requirements](#2-prerequisites--system-requirements)
  * [3. Extracting and Accessing Project Files](#3-extracting-and-accessing-project-files)
  * [4. Configuring Environment \& Installation](#4-configuring-environment--installation)
  * [5. Running the Application](#5-running-the-application)

    * [Option A: Accessing the Live Web App (Instant Access)](#option-a-accessing-the-live-web-app-instant-access)
    * [Option B: Running Locally on Your Computer](#option-b-running-locally-on-your-computer)
  * [6. Adding to Home Screen (Mobile \& Desktop App Experience)](#6-adding-to-home-screen-mobile--desktop-app-experience)

    * [On Android / Chrome](#on-android--chrome)
    * [On iPhone / iPad (Safari)](#on-iphone--ipad-safari)
    * [On Windows / Mac (Desktop Chrome / Edge)](#on-windows--mac-desktop-chrome--edge)
    * [Simultaneous Real-Time Device Synchronization](#simultaneous-real-time-device-synchronization)
  * [7. Step-by-Step User Walkthrough](#7-step-by-step-user-walkthrough)

    * [Step 1: Account Registration](#step-1-account-registration)
    * [Step 2: One-Time Email Activation (First-Time Sign-Up Only)](#step-2-one-time-email-activation-first-time-sign-up-only)
    * [Step 3: Logging In with 6-Digit Email OTP (Two-Factor Authentication)](#step-3-logging-in-with-6-digit-email-otp-two-factor-authentication)
    * [Step 4: Managing Passwords in the Password Vault](#step-4-managing-passwords-in-the-password-vault)
    * [Step 5: Uploading \& Encrypting Files with SHA-256 Checksums](#step-5-uploading--encrypting-files-with-sha-256-checksums)
    * [Step 6: Using Real-Time Search \& Tag Filtering](#step-6-using-real-time-search--tag-filtering)
    * [Step 7: Switching Between Dark and Light Modes](#step-7-switching-between-dark-and-light-modes)
    * [Step 8: Reviewing Personal Activity \& Security Logs](#step-8-reviewing-personal-activity--security-logs)
  * [8. Beginner's Setup \& Operation Checklist](#8-beginners-setup--operation-checklist)
  * [9. Troubleshooting \& Frequently Asked Questions (FAQ)](#9-troubleshooting--frequently-asked-questions-faq)
  * [10. Submitting Your Project Files (For Students)](#10-submitting-your-project-files-for-students)
  * [11. User Testing \& Version Control](#11-user-testing--version-control)

\---

# BEGINNER'S USER MANUAL \& SETUP GUIDE

## 1\. Introduction

### What is SecureVault Guard?

**SecureVault Guard** is an intuitive, all-in-one digital security dashboard. It securely stores your passwords, protects your confidential files, detects data breaches, and keeps all your devices synchronized in real time.

Built with beginners in mind, you can use SecureVault Guard on **any device** (computers, laptops, tablets, Android, or iOS phones) directly through your web browser or by adding it to your home screen as an app without complicated installation procedures.

### Core Features

* 🔑 **Encrypted Password Vault**: Safely store credentials, generate 16+ character strong passwords, and organize items with custom tags (`#Work`, `#Finance`, `#Critical`).
* 🚨 **Automated Data Breach Detection**: Checks your credentials in real time against public data breaches using the *Have I Been Pwned* k-anonymity API.
* 📁 **Secure File Vault with Tamper Detection**: Upload confidential files (PDF, DOCX, TXT, PNG, JPG, CSV, ZIP up to 10 MB). The app calculates a **SHA-256 digital fingerprint** to verify that your files are never altered or corrupted.
* 🔍 **Real-Time Search \& Tag Filtering**: Search instantly by name, email, checksum, or tags, with live match counters and clickable tag chips.
* 📱 **Universal Cross-Platform Experience**: Works smoothly on any device. Add it to your home screen on Android or iPhone to use it as a native-feeling app.
* ⚡ **Live Real-Time Cloud Sync**: Changes made on one device (such as your phone) instantly appear on your computer without reloading the page.
* 🔒 **Two-Factor Authentication (2FA OTP)**: Protects your account with real 6-digit email OTP verification codes.
* 🌓 **Dark \& Light Themes**: Switch between Dark Mode and Light Mode with a single click.
* 📜 **Personal Activity Logs**: Review your private login timestamps, file checks, and password modifications.

### System Overview \& Visual Flowchart

```text
+-------------------------------------------------------------------------+
|                         SECUREVAULT GUARD SUITE                         |
+-------------------------------------------------------------------------+
       |                                                    |
       v                                                    v
\[ Desktop Web Browser ]                            \[ Mobile Home Screen App ]
(Windows, Mac, Linux)                              (Android, iPhone, iPad)
       |                                                    |
       +-------------------------+--------------------------+
                                 |
                                 v
                 \[ Client-Side AES-256 Encryption ]
                                 |
        +------------------------+------------------------+
        |                                                 |
        v                                                 v
\[ Password Vault ]                                 \[ File Vault ]
- Strong Password Generator                        - SHA-256 Hash Verification
- Breach Detection (HIBP API)                      - Tamper Detection \& Repair
- Tag \& Real-Time Search Filter                    - Category \& Tag Search
        |                                                 |
        +------------------------+------------------------+
                                 |
                                 v
        \[ Firebase Firestore \& Real-Time Cloud Synchronization ]
                                 |
        \[ FormSubmit 2FA One-Time Passcode Email Verification ]
```

\---

## 2\. Prerequisites \& System Requirements

To access and use SecureVault Guard, all you need is a modern web browser:

|Requirement|Recommended Version|Purpose|
|-|-|-|
|**Operating System**|Windows 10/11, macOS, Linux, Android, or iOS|Any modern operating system|
|**Web Browser**|Google Chrome, Edge, Safari, Firefox, or Brave|To open the web application|
|**Internet Connection**|Active Internet connection|For 2FA OTP delivery and real-time cloud synchronization|
|**Node.js (Optional)**|Node.js 18.x or 20.x LTS|*Only required if building or running the project locally from source code*|

\---

## 3\. Extracting and Accessing Project Files

If you downloaded the program source files as a `.zip` archive:

### On Windows:

1. Locate `SecureVault-Guard.zip` in your **Downloads** folder.
2. Right-click the file and select **Extract All...**.
3. Choose a destination folder (e.g., `C:\\Projects\\SecureVault-Guard`) and click **Extract**.

### On macOS / Linux:

1. Double-click `SecureVault-Guard.zip`, or open a terminal and execute:

```bash
   unzip SecureVault-Guard.zip -d SecureVault-Guard
   ```

2. Open the newly extracted folder.

\---

## 4\. Configuring Environment \& Installation

If you are running the project locally from the extracted source files:

1. Open your computer's terminal or Command Prompt.
2. Navigate to the project directory:

```bash
   cd path/to/SecureVault-Guard
   ```

3. Install the project packages:

```bash
   npm install
   ```

*(If you are accessing the hosted live website version, you can skip this step entirely!)*

\---

## 5\. Running the Application

### Option A: Accessing the Live Web App (Instant Access)

1. Open your web browser on any device.
2. Navigate to the application URL ( https://securevaultguard.ai.studio ).
3. The sign-in screen appears immediately!

### Option B: Running Locally on Your Computer

If running from source code on your local computer:

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser to start using the app.

\---

## 6\. Adding to Home Screen (Mobile \& Desktop App Experience)

Users on all platforms can install SecureVault Guard to their home screen or desktop with a few clicks:

### On Android / Chrome:

1. Open the website in **Google Chrome** on your Android phone.
2. Tap the **Three Dots Menu (⋮)** in the top right corner.
3. Tap **"Install app"** (or **"Add to Home screen"**).
4. Tap **"Install"**. The app icon is added to your home screen!

### On iPhone / iPad (Safari):

1. Open the website in **Safari**.
2. Tap the **Share button** (square with an upward arrow) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner.

### On Windows / Mac (Desktop Chrome / Edge):

1. Open the website in Chrome or Edge.
2. Click the **Install icon** in the browser address bar (top right).
3. Click **"Install"** to run SecureVault Guard as a standalone desktop window.

### Simultaneous Real-Time Device Synchronization:

* Sign in with your account on both your computer and your phone.
* Any password or file you add or edit on one device updates **instantly** on the other device in real time!

\---

## 7\. Step-by-Step User Walkthrough

### Step 1: Account Registration

1. On the initial screen, click **"Create Account"**.
2. Enter your **Full Name**, **Email Address**, and a master **Password** (minimum 8 characters).
3. Click **"Register Account"**.

### Step 2: One-Time Email Activation (First-Time Sign-Up Only)

> 💡 \*This step happens only ONCE when you first sign up.\*

1. When you first log in, **FormSubmit** sends an activation email to verify your email address for OTP delivery.
2. Open your email inbox and find the email from **FormSubmit**. *(If not visible, check your **Spam / Junk** folder).*
3. Click the blue **"Activate Form"** button in the email.
4. It activates **immediately** in your browser.
5. Return to SecureVault Guard and click **"Resend OTP"** to receive your 6-digit code.

### Step 3: Logging In with 6-Digit Email OTP (Two-Factor Authentication)

1. Enter your registered email and password on the **Sign In** screen.
2. Click **"Sign In to Vault"**.
3. Check your email for your 6-digit verification code.
4. Enter the 6 digits into the input boxes and click **"Verify \& Continue"**.

### Step 4: Managing Passwords in the Password Vault

1. Click **"Password Vault"** in the top navigation bar.
2. Enter the **Website / Title**, **Username**, and **Password** (or click **"Generate Strong"**).
3. Assign a **Category** (*Personal, Work, Finance, Social*) and custom **Tags** (e.g., `#Work`, `#Critical`).
4. Click **"Save Encrypted Password"**.
5. Check the **Breach Monitor** badge (*Safe* or *🚨 Leaked*). If compromised, click **"Remediate Breach"** to update your password.

### Step 5: Uploading \& Encrypting Files with SHA-256 Checksums

1. Click **"File Vault"** in the navigation bar.
2. Click **"Choose File"** to select a document or image (PDF, Word, Excel, Images, ZIP up to 10 MB).
3. Add optional tags (e.g., `#Tax2026`, `#Confidential`).
4. Click **"Upload and Encrypt File"**.
5. The application computes a **SHA-256 digital hash** to protect the file against tampering.
6. Click the **Download Icon** at any time to decrypt and download your file.

### Step 6: Using Real-Time Search \& Tag Filtering

1. In either vault, type into the search bar to filter items instantly.
2. Click any of the **Tag Pills** (e.g., `#Work`, `#Finance`, `#PDF`) to narrow down results.
3. Click **"Reset filters"** (or press `Esc`) to clear your search.

### Step 7: Switching Between Dark and Light Modes

* Click the **Sun / Moon Icon** in the top navigation bar to toggle between Dark and Light themes.

### Step 8: Reviewing Personal Activity \& Security Logs

1. Click **"Security Logs"** in the navigation bar.
2. View real-time timestamps of all user activities (e.g., *Logins, Password Additions, File Integrity Verifications*).
3. All logs are private to your user account.

\---

## 8\. Beginner's Setup \& Operation Checklist

* \[ ] **Access Website**: Opened SecureVault Guard in your browser.
* \[ ] **Create Account**: Registered with your name, email, and password.
* \[ ] **One-Time Email Activation**: Clicked "Activate Form" in the FormSubmit email.
* \[ ] **Complete 2FA Login**: Entered your 6-digit OTP code.
* \[ ] **Save a Password**: Added a credential and verified breach detection.
* \[ ] **Upload a File**: Uploaded a file and verified its SHA-256 checksum.
* \[ ] **Test Real-Time Search**: Filtered entries by search query and tag pills.
* \[ ] **Add to Home Screen**: Added the app to your phone or desktop home screen.
* \[ ] **Verify Real-Time Sync**: Opened on two devices simultaneously to verify instant updates.

\---

## 9\. Troubleshooting \& Frequently Asked Questions (FAQ)

### Q1: I did not receive my OTP email on my first login. What should I do?

* **Solution**: Check your **Spam / Junk folder** for an email from **FormSubmit**. Open that email and click the **"Activate Form"** button. Return to SecureVault Guard and click **"Resend OTP"**. Your code will arrive immediately.

### Q2: Do I need to activate FormSubmit on every login?

* **Answer**: No. This activation is required only once per email address. All future logins will send the OTP directly to your inbox.

### Q3: How do I install this on my smartphone?

* **Solution**: Open the website in **Chrome** (Android) or **Safari** (iOS), tap the menu/share button, and select **"Add to Home Screen"** or **"Install app"**.

### Q4: Will changes synchronize automatically between my phone and computer?

* **Answer**: Yes! Because the system connects to a real-time cloud database, any action taken on your phone appears on your computer within milliseconds.

### Q5: How do I reset my password?

* **Solution**: On the Sign In screen, click **"Forgot Password?"**, enter your email, and click **"Send Password Reset Link"**.

\---

## 10\. Submitting Your Project Files (For Students)

When submitting this project for academic evaluation:

1. **Delete the `node\_modules` folder** to minimize file size:

```bash
   # Windows (PowerShell)
   Remove-Item -Recurse -Force node\_modules

   # macOS / Linux
   rm -rf node\_modules
   ```

2. **Compress into a ZIP archive**: Right-click the root folder and select **Compress** or **Send to → Compressed (zipped) folder**.
3. **Verify submission contents**: Confirm that `src/`, `public/`, `package.json`, `vite.config.ts`, `index.html`, and `README.md` are included.

\---

## 11\. User Testing \& Version Control

* **Peer Testing**: Ask a fellow student or beginner to open the app, register, and add a credential without verbal assistance.
* **Feedback Iteration**: Refine instructions based on any points of confusion.
* **Version Control**: Record all feature updates using Git commits (`git commit -m "docs: complete user manual and TID"`).

\---

**© 2026 SecureVault Guard — AES-256 Encrypted Security Suite**

