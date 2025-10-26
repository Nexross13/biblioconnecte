const getAverageRating = (reviews = []) => {
  if (!reviews.length) return null
  const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
  return total / reviews.length
}

export default getAverageRating
