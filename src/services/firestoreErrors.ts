export function mapFirestoreError(err: unknown): Error {
  const code = (err as { code?: string })?.code?.replace('firestore/', '') ?? '';

  switch (code) {
    case 'permission-denied':
      return new Error('You do not have permission to save this. Please contact support.');
    case 'unavailable':
    case 'network-request-failed':
      return new Error('Network error. Check your connection and try again.');
    case 'deadline-exceeded':
    case 'cancelled':
      return new Error('The request took too long. Please try again.');
    default:
      return new Error('Something went wrong while saving. Please try again.');
  }
}
