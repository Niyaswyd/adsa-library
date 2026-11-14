# Firebase setup and deployment

The app uses Firebase Authentication for staff sign-in and Cloud Firestore for shared student and circulation records. A Firebase web config is public client configuration, not an admin credential. Never put a service-account key in this site.

## One-time project setup

1. In Firebase Console, open the `adsa-library` project.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Create email/password accounts for staff in the Authentication users page. Google accounts are created on their first sign-in.
3. In **Firestore Database**, create the database in production mode. Deploy this repository's `firestore.rules` before using the app.
4. Open **Authentication → Settings → Authorized domains** and ensure the Firebase Hosting domain is listed.
5. Install Node.js LTS, then install the Firebase CLI and sign in with an account that can deploy this project. From the repository root run:

   ```text
   npm install -g firebase-tools
   firebase login
   firebase deploy --project adsa-library --only firestore:rules,hosting
   ```

## Granting or revoking staff access

1. Have the staff member sign in to the site once. Email/password accounts must have a verified email.
2. In **Authentication → Users**, copy that account's UID.
3. In **Firestore Database → Data**, create a document in the `staff` collection whose document ID is the UID. Add the field `active` with Boolean value `true`.
4. To revoke access, change `active` to `false` or delete that staff document.

The app does not allow users to grant themselves staff access. Firestore rules deny access to student and circulation records unless the signed-in, verified account has an active staff document. Manage staff documents in the Firebase Console; client access to create, list, or edit them is denied.

The database starts empty: the example student and circulation records in the old browser-only version are not copied into Firestore.
