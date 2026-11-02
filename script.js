import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// The public Firebase web configuration is injected by firebase-config.js.
// Never place service-account credentials in this repository.
const config = window.FREEGRC_FIREBASE_CONFIG;
const configured = config && ["apiKey", "authDomain", "projectId", "appId"].every(k => typeof config[k] === "string" && config[k].length > 0);
let auth, db;
if (configured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}
const $ = id => document.getElementById(id);
const backdrop = $("auth-backdrop"), form = $("auth-form");
let mode = "signup", lastFocus = null, activeUser = null;
const toolUrl = new URL("grc.html", window.location.href).href;
$("yr").textContent = new Date().getFullYear();
function setMode(next) {
  mode = next;
  const signup = next === "signup";
  $("auth-heading").textContent = signup ? "Create your free account" : "Welcome back";
  $("auth-description").textContent = signup ? "Start organizing your compliance work." : "Sign in to continue to your tool.";
  $("signup-fields").hidden = !signup;
  $("full-name").required = signup;
  $("company-name").required = signup;
  $("auth-password").autocomplete = signup ? "new-password" : "current-password";
  $("password-hint").hidden = !signup;
  $("auth-submit").textContent = signup ? "Create account" : "Log in";
  $("auth-switch-label").textContent = signup ? "Already registered?" : "New to FreeGRCTool?";
  $("auth-switch").textContent = signup ? "Log in" : "Create an account";
  $("auth-error").textContent = "";
}
function openModal(next) {
  lastFocus = document.activeElement;
  form.reset(); setMode(next);
  backdrop.hidden = false; document.body.classList.add("modal-open");
  $(next === "signup" ? "full-name" : "auth-email").focus();
}
function closeModal() {
  backdrop.hidden = true; document.body.classList.remove("modal-open");
  lastFocus?.focus?.();
}
document.querySelectorAll("[data-auth]").forEach(el => el.addEventListener("click", e => {
  e.preventDefault();
  if (activeUser) { window.location.assign(toolUrl); return; }
  openModal(el.dataset.auth);
}));
$("auth-close").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
$("auth-switch").addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));
document.addEventListener("keydown", e => {
  if (backdrop.hidden) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab") {
    const focusable = [...backdrop.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
if (configured) onAuthStateChanged(auth, user => {
  activeUser = user;
  document.querySelectorAll('[data-auth="signup"]').forEach(el => { el.textContent = user ? "Open tool" : "Get started free"; });
});
const messages = {
  "auth/email-already-in-use": "An account already exists for this email. Please log in.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Please choose a stronger password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Try again later.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "permission-denied": "Your account was created, but the profile could not be saved. Contact support before proceeding."
};
form.addEventListener("submit", async e => {
  e.preventDefault();
  const error = $("auth-error"), submit = $("auth-submit");
  error.textContent = "";
  if (!configured) { error.textContent = "Sign-up is not configured yet. The site administrator must complete Firebase setup."; return; }
  if (!form.reportValidity()) return;
  const email = $("auth-email").value.trim(), password = $("auth-password").value;
  const name = $("full-name").value.trim(), company = $("company-name").value.trim();
  if (mode === "signup" && (!name || !company || password.length < 12)) { error.textContent = "Enter your name, company and a password of at least 12 characters."; return; }
  submit.disabled = true;
  try {
    if (mode === "signup") {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid, fullName: name, email: credential.user.email,
        company, signupDate: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    window.location.assign(toolUrl);
  } catch (err) {
    error.textContent = messages[err.code] || "Could not complete the request. Please try again.";
    console.error("Authentication error:", err.code || err.message);
  } finally { submit.disabled = false; }
});
if (new URLSearchParams(location.search).get("auth") === "signup") openModal("signup");
if (new URLSearchParams(location.search).get("auth") === "login") openModal("login");
