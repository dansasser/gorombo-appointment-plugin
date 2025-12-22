import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Hook to validate that appointments have either a customer OR a guest, but not both
 * Runs before validation on the Appointments collection
 */
export const validateCustomerOrGuest: CollectionBeforeValidateHook = ({
  data,
}) => {
  // Only validate for appointments (not blockouts)
  if (data?.type !== 'appointment') {
    return data
  }

  const hasCustomer = !!data.customer
  const hasGuest = !!data.guest

  // For appointments, must have exactly one: customer OR guest
  if (!hasCustomer && !hasGuest) {
    throw new Error('Appointments must have either a registered customer or a guest customer')
  }

  if (hasCustomer && hasGuest) {
    throw new Error('Appointments cannot have both a registered customer and a guest customer. Please choose one.')
  }

  return data
}
