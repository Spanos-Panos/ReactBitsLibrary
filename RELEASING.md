# 🚀 ReactBits Explorer - Release Guide

This document explains how to build, package, and release new versions of the **ReactBits Explorer** desktop application.

## 🕒 How to Release a New Version

Whenever you make changes to the UI or components and want to share them as a new `.exe`, follow these simple steps:

### 1. Update the Version
Open `package.json` in the root directory and update the `"version"` field (e.g., from `0.1.0` to `0.2.0`).

### 2. Push Your Changes
Commit and push all your work to your main branch (e.g., `Version0.1` or `master`):
```powershell
git add .
git commit -m "feat: your amazing new feature"
git push origin Version0.1
```

### 3. Create a Version Tag
Pushing a **Tag** is what triggers the automated building process on GitHub:
```powershell
# Create the tag (matching the version in package.json)
git tag v0.2.0

# Push the tag to GitHub
git push origin v0.2.0
```

---

## 🛠️ What Happens Next?

1.  **Automated Build:** Go to your **GitHub Repository > Actions** tab. You will see a workflow named **"Build and Release Electron App"** starting automatically.
2.  **Packaging:** GitHub's servers will spend ~5-8 minutes building the `Portable` and `Installer` versions for Windows.
3.  **Release Page:** Once finished, go to your repository's **Releases** page. You will see a new release containing the `.exe` files ready for download!

---

## 🔄 In-App Updates

The application is equipped with `electron-updater`. This means:
*   When a user launches the app, it checks your GitHub Releases.
*   If you've pushed a newer version, the app will notify them that an update is available.
*   They don't have to check the website manually!

## 🧩 Modifying Components
If you add or rename folders inside `ReactBitsComponents/`, make sure to run the manifest generator so the UI can find them:
```powershell
npm run generate:manifest
```
Then commit and push the changes as part of your next release!

---

**Happy Coding! 🚀**
