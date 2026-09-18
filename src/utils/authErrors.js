export function getAuthErrorMessage(error, action) {
  if (error?.code?.includes('api-key') || error?.code?.includes('configuration-not-found')) {
    return 'Firebase is not configured correctly. Add the web app settings to your local .env file.'
  }

  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.'
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.'
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not enabled in Firebase Authentication yet.'
    default:
      return `We could not ${action}. Please try again.`
  }
}
