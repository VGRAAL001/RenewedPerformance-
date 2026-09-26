export const ADMIN_EMAIL = 'arendsberucia@gmail.com'

export function isAdminUser(user) {
  return user?.email?.toLowerCase() === ADMIN_EMAIL
}
