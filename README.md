# FreeGRCTool.com deployment

## Files
- `index.html`: marketing landing page and sign-up/login modal.
- `style.css`: dark-theme styles.
- `script.js`: Firebase Auth and Firestore user profile creation.
- `firebase-config.js`: **must be configured before sign-up works**.
- `firestore.rules`: deny-by-default Firestore rules for user profiles.
- `grc.html`: original browser-based GRC tool (unchanged).
- `CNAME`: custom domain for GitHub Pages.

## 1. Configure Firebase (required)
1. Create a Firebase project at https://console.firebase.google.com/ .
2. Add a **Web app** in Project settings > General and copy the Firebase web configuration.
3. Edit `firebase-config.js`, replacing `null` with the real configuration object from Firebase Console, for example the actual object displayed in the console (not service-account JSON). Never commit service-account private keys.
4. In Authentication > Sign-in method, enable **Email/Password**.
5. In Authentication > Settings > Authorized domains, add `freegrctool.com`, `www.freegrctool.com` (if used), and `<username>.github.io` for testing. Firebase may require explicit localhost authorization for local testing.
6. Create a **Cloud Firestore** database. In Firestore > Rules, paste `firestore.rules` and publish. Choose the correct database region and confirm billing/quotas.
7. Test creating a new account. Inspect Authentication > Users and Firestore > `users/{uid}`. Firestore uses the Firebase Auth UID as the document ID; passwords are never stored in Firestore.
8. Configure a support procedure for partially completed registrations: Firebase Auth registration may succeed even if the Firestore write fails. Reattempting signup with the same email will then show an existing-account error. Use the Firebase Console to repair/delete these accounts as appropriate.

**Security:** Firebase web configuration is public by design; Firestore rules are your data boundary. Restrict API keys where appropriate, enable Firebase App Check if compatible, configure password policies, and consider email verification and abuse protection before public launch. Email/password sign-in does not prove the email is a corporate address. The current UI collects a work email but does not enforce corporate domains.

## 2. GitHub repository
1. Create a repository named `FreeGRCTool` on GitHub.
2. Upload the site files at the repository root using **Add file > Upload files**. Or run:

```bash
git init
git branch -M main
git add index.html style.css script.js firebase-config.js firestore.rules grc.html CNAME README.md
git commit -m "Deploy FreeGRCTool landing page and Firebase signup"
git remote add origin https://github.com/YOUR_USERNAME/FreeGRCTool.git
git push -u origin main
```

Replace `YOUR_USERNAME` with the actual GitHub username. Do not publish confidential client data, sample evidence, private documents, service account keys, or the entire original archive without reviewing it. The included `grc.html` is publicly accessible on GitHub Pages.

## 3. Enable GitHub Pages
In the repository select **Settings > Pages > Build and deployment > Deploy from a branch**. Select `main` and `/(root)` and save. The project URL will be `https://YOUR_USERNAME.github.io/FreeGRCTool/`. After DNS is configured, enable **Enforce HTTPS** when available.

## 4. DNS for freegrctool.com
At your domain registrar/DNS provider create these **A records** for the apex (`@`):

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional `www` CNAME: `www` → `YOUR_USERNAME.github.io` (replace username). In GitHub Pages > Custom domain set `freegrctool.com`; keep the root `CNAME` file. Wait for DNS verification and TLS provisioning. Remove conflicting apex A/AAAA records. Check current GitHub documentation before changes: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site .

## 5. Editing content in the GitHub browser
Open the repository > `index.html` > pencil icon **Edit this file**. Change text within headings/paragraphs and select **Commit changes**. For theme and layout edit `style.css`. For sign-in logic edit `script.js` carefully. The paid-services links point to `https://mycompliantcmmc.com`. Changes to `main` redeploy automatically. Use a branch and pull request for production changes.

## 6. Critical deployment limitations
- **GitHub Pages is static.** It cannot execute the supplied `serve.js`, its `/ai/chat` proxy, or its `/project-management/` directory-serving routes. These features require separate hosting/backend services and a review of their security model.
- **The included `grc.html` remains unchanged.** It contains browser-side application functionality and uses local browser storage. It is not integrated with Firebase data isolation, nor is its data persisted per Firebase account.
- **The tool URL is public.** Redirecting signed-in users to `grc.html` is a user-experience flow, **not an authorization boundary**. Anyone can directly load the public static file. To restrict application access or securely store CMMC/CUI evidence, implement server-enforced authentication/authorization, organization-scoped data isolation, appropriate storage rules, and security/compliance review before production use.
- **No CUI or sensitive assessment evidence should be entered** until the complete application and hosting environment have been independently reviewed and approved for the intended data classification.
- The current code does not implement email verification, password reset, account deletion, marketing consent, privacy notice, or organization invitations. Add those before a broad public launch as required by your operational/legal requirements.

## 7. Smoke test
1. Serve locally with `python -m http.server 8080` and open `http://localhost:8080/`.
2. Verify mobile layout, CTA links, modal open/close, keyboard navigation, and login/signup mode switch.
3. Configure Firebase, test a new registration, verify Auth and Firestore records, then log in with the same account.
4. Confirm redirect to `grc.html` and separately test server-dependent features; they will not work on GitHub Pages without a backend.
5. Confirm domain, HTTPS, and Firebase authorized domains after deployment.
